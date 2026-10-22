import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Payload, PayloadRequest } from 'payload'

import type { Order, Transaction } from '@/payload-types'
import { getPaystackOrderID } from '../../src/utilities/paystack'
import { finalizePaystackPayment } from '../../src/lib/payments/paystack'

const transaction = {
  id: 'transaction-1',
  amount: 2500,
  currency: 'NGN',
  customerEmail: 'customer@example.com',
  status: 'pending',
  paystack: { reference: 'reference-1', status: 'pending' },
  items: [{ product: 'product-1', quantity: 2 }],
  cart: 'cart-1',
} as unknown as Transaction

function createPayloadMock() {
  let order: Order | undefined
  const payload = {
    find: vi.fn(async ({ collection }: { collection: string }) => ({
      docs: collection === 'transactions' ? [transaction] : order ? [order] : [],
    })),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      order = {
        ...data,
        accessToken: 'guest-token',
      } as unknown as Order
      return order
    }),
    update: vi.fn(async (_args: { collection: string }) => ({})),
    db: {
      updateOne: vi.fn(
        async (_args: {
          collection: string
          data: Record<string, unknown>
        }): Promise<Record<string, unknown> | null> => ({}),
      ),
    },
    jobs: {
      queue: vi.fn(async () => ({})),
    },
    logger: {
      error: vi.fn(),
    },
  }
  const req = { payload: { logger: payload.logger } } as unknown as PayloadRequest

  return {
    payload: payload as unknown as Payload,
    req,
    mocks: payload,
  }
}

function mockSuccessfulVerification(amount = 2500) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        status: true,
        data: {
          amount,
          currency: 'NGN',
          reference: 'reference-1',
          status: 'success',
          customer: { email: 'customer@example.com' },
        },
      }),
    ),
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('finalizePaystackPayment', () => {
  it('creates one order and decrements inventory only once across retries', async () => {
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'test-secret')
    mockSuccessfulVerification()
    const { payload, req, mocks } = createPayloadMock()

    const first = await finalizePaystackPayment({ payload, req, reference: 'reference-1' })
    const second = await finalizePaystackPayment({ payload, req, reference: 'reference-1' })

    expect(first).toMatchObject({
      status: 'succeeded',
      orderID: getPaystackOrderID('reference-1'),
      customerEmail: 'customer@example.com',
      accessToken: 'guest-token',
    })
    if (first.status !== 'succeeded' || second.status !== 'succeeded') {
      throw new Error('Expected Paystack payment to be finalized')
    }
    expect(second.orderID).toBe(first.orderID)
    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.db.updateOne.mock.calls.filter(([args]) => 'inventory' in args.data)).toHaveLength(
      1,
    )
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'carts',
        data: expect.objectContaining({ items: [] }),
      }),
    )
    expect(mocks.jobs.queue).toHaveBeenCalledTimes(2)
  })

  it('allows only one concurrent webhook or callback to finalize the payment', async () => {
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'test-secret')
    mockSuccessfulVerification()
    const { payload, req, mocks } = createPayloadMock()
    let lockHeld = false

    mocks.db.updateOne.mockImplementation(async ({ data }) => {
      if ('finalizationLock' in data) {
        if (data.finalizationLock === null) {
          lockHeld = false
          return {}
        }
        if (lockHeld) return null
        lockHeld = true
        return {}
      }
      return {}
    })

    const results = await Promise.all([
      finalizePaystackPayment({ payload, req, reference: 'reference-1' }),
      finalizePaystackPayment({
        payload,
        req: { ...req } as PayloadRequest,
        reference: 'reference-1',
      }),
    ])

    expect(results.map(({ status }) => status).sort()).toEqual(['pending', 'succeeded'])
    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.db.updateOne.mock.calls.filter(([args]) => 'inventory' in args.data)).toHaveLength(
      1,
    )
    expect(mocks.jobs.queue).toHaveBeenCalledTimes(1)
  })

  it('retries transient Mongo write conflicts without repeating inventory deductions', async () => {
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'test-secret')
    mockSuccessfulVerification()
    const { payload, req, mocks } = createPayloadMock()
    let failedOnce = false

    mocks.update.mockImplementation(async ({ collection }) => {
      if (collection === 'carts' && !failedOnce) {
        failedOnce = true
        throw Object.assign(new Error('Transient Mongo write conflict'), { code: 112 })
      }
      return {}
    })

    const result = await finalizePaystackPayment({
      payload,
      req,
      reference: 'reference-1',
    })

    expect(result.status).toBe('succeeded')
    expect(mocks.update.mock.calls.filter(([args]) => args.collection === 'carts')).toHaveLength(2)
    expect(mocks.db.updateOne.mock.calls.filter(([args]) => 'inventory' in args.data)).toHaveLength(
      1,
    )
  })

  it('does not create an order or change stock when verified amount differs', async () => {
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'test-secret')
    mockSuccessfulVerification(1)
    const { payload, req, mocks } = createPayloadMock()

    await expect(
      finalizePaystackPayment({ payload, req, reference: 'reference-1' }),
    ).rejects.toThrow('Paystack payment details do not match the transaction')
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.db.updateOne).not.toHaveBeenCalled()
    expect(mocks.jobs.queue).not.toHaveBeenCalled()
  })
})
