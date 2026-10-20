import type { Payload, PayloadRequest } from 'payload'
import { randomUUID } from 'node:crypto'

import type { Order, Transaction } from '@/payload-types'
import { AdminOrderNotificationEmailHtml, formatPrice } from '@/components/Emails/AdminOrderEmail'
import { OrderConfirmationEmailHtml } from '@/components/Emails/RecieptEmail'

import { getPaystackOrderID, normalizePaystackStatus } from '@/utilities/paystack'

const PAYSTACK_API_URL = 'https://api.paystack.co'
const PAYSTACK_REQUEST_TIMEOUT_MS = 10_000
const FINALIZATION_LOCK_MS = 120_000
const WRITE_CONFLICT_RETRIES = 3

type PaystackTransactionData = {
  amount?: number
  currency?: string
  reference?: string
  status?: string
  customer?: {
    email?: string
  }
}

type PaystackAPIResponse = {
  status?: boolean
  message?: string
  data?: PaystackTransactionData
}

export type PaystackFinalizationResult =
  | { status: 'pending' }
  | { status: 'failed' }
  | {
      status: 'succeeded'
      orderID: string
      customerEmail: string
      accessToken?: string
    }

function isPaystackAPIResponse(
  value: unknown,
): value is PaystackAPIResponse & { status: boolean; data: PaystackTransactionData } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    typeof value.status === 'boolean' &&
    'data' in value &&
    typeof value.data === 'object' &&
    value.data !== null
  )
}

function isMongoWriteConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  if ('code' in error && error.code === 112) return true
  if (
    'errorLabels' in error &&
    Array.isArray(error.errorLabels) &&
    error.errorLabels.includes('TransientTransactionError')
  ) {
    return true
  }
  return (
    'hasErrorLabel' in error &&
    typeof error.hasErrorLabel === 'function' &&
    error.hasErrorLabel('TransientTransactionError')
  )
}

async function withWriteConflictRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (!isMongoWriteConflict(error) || attempt >= WRITE_CONFLICT_RETRIES) throw error
      await new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt))
    }
  }
}

async function findTransaction(payload: Payload, req: PayloadRequest, reference: string) {
  const result = await payload.find({
    collection: 'transactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      'paystack.reference': {
        equals: reference,
      },
    },
  })

  return result.docs[0] as Transaction | undefined
}

async function claimPaymentFinalization(
  payload: Payload,
  transactionID: string,
): Promise<string | undefined> {
  const lockToken = randomUUID()
  const now = new Date()
  const result = await withWriteConflictRetry(() =>
    payload.db.updateOne({
      collection: 'transactions',
      data: {
        finalizationLock: lockToken,
        finalizationLockUntil: new Date(now.getTime() + FINALIZATION_LOCK_MS).toISOString(),
      },
      where: {
        and: [
          { id: { equals: transactionID } },
          {
            or: [
              { finalizationLockUntil: { equals: null } },
              { finalizationLockUntil: { less_than: now.toISOString() } },
            ],
          },
        ],
      },
    }),
  )

  return result ? lockToken : undefined
}

async function releasePaymentFinalization(
  payload: Payload,
  transactionID: string,
  lockToken: string,
): Promise<void> {
  await withWriteConflictRetry(() =>
    payload.db.updateOne({
      collection: 'transactions',
      data: {
        finalizationLock: null,
        finalizationLockUntil: null,
      },
      where: {
        and: [{ id: { equals: transactionID } }, { finalizationLock: { equals: lockToken } }],
      },
    }),
  )
}

export async function markPaystackTransactionFailed({
  payload,
  req,
  reference,
}: {
  payload: Payload
  req: PayloadRequest
  reference: string
}): Promise<void> {
  const transaction = await findTransaction(payload, req, reference)
  if (!transaction || transaction.status === 'succeeded' || transaction.order) return

  await payload.update({
    collection: 'transactions',
    data: {
      status: 'failed',
      paystack: {
        ...transaction.paystack,
        status: 'failed',
      },
    },
    id: transaction.id,
    overrideAccess: true,
    req,
  })
}

async function findOrder(payload: Payload, req: PayloadRequest, id: string) {
  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      id: {
        equals: id,
      },
    },
  })

  return result.docs[0] as Order | undefined
}

async function verifyPayment(reference: string, transaction: Transaction) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('Paystack secret key is required')

  const response = await fetch(
    `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      signal: AbortSignal.timeout(PAYSTACK_REQUEST_TIMEOUT_MS),
    },
  )

  const body: unknown = await response.json()
  if (!response.ok || !isPaystackAPIResponse(body) || body.status !== true) {
    throw new Error(
      typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
        ? body.message
        : 'Unable to verify Paystack payment',
    )
  }

  const payment = body.data
  if (payment.reference !== reference) {
    throw new Error('Paystack returned a different payment reference')
  }
  if (typeof payment.status !== 'string') {
    throw new Error('Paystack returned an invalid payment status')
  }

  const status = normalizePaystackStatus(payment.status)
  if (status === 'succeeded') {
    const expectedEmail = transaction.customerEmail?.trim().toLowerCase()
    const verifiedEmail =
      typeof payment.customer?.email === 'string'
        ? payment.customer.email.trim().toLowerCase()
        : undefined

    if (
      !Number.isInteger(payment.amount) ||
      payment.amount !== transaction.amount ||
      typeof payment.currency !== 'string' ||
      payment.currency?.toUpperCase() !== transaction.currency?.toUpperCase() ||
      !expectedEmail ||
      verifiedEmail !== expectedEmail
    ) {
      throw new Error('Paystack payment details do not match the transaction')
    }
  }

  return status
}

async function enqueueOrderEmails(payload: Payload, req: PayloadRequest, orderID: string) {
  try {
    await payload.jobs.queue({
      task: 'sendOrderEmails',
      input: { orderID },
      req,
    })
  } catch (error) {
    payload.logger.error({ err: error, orderID }, 'Failed to queue order emails')
  }
}

export async function finalizePaystackPayment({
  payload,
  req,
  reference,
}: {
  payload: Payload
  req: PayloadRequest
  reference: string
}): Promise<PaystackFinalizationResult> {
  if (!reference || reference.length > 200) {
    throw new Error('A valid Paystack reference is required')
  }

  const transaction = await findTransaction(payload, req, reference)
  if (!transaction) {
    throw new Error('No transaction found for the provided Paystack reference')
  }

  const paymentStatus = await verifyPayment(reference, transaction)
  if (paymentStatus === 'pending') {
    return { status: 'pending' }
  }

  if (paymentStatus === 'failed') {
    await withWriteConflictRetry(() =>
      payload.update({
        collection: 'transactions',
        data: {
          status: 'failed',
          paystack: {
            ...transaction.paystack,
            status: 'failed',
          },
        },
        id: transaction.id,
        overrideAccess: true,
        req,
      }),
    )

    return { status: 'failed' }
  }

  const lockToken = await claimPaymentFinalization(payload, transaction.id)
  if (!lockToken) {
    const currentTransaction = await findTransaction(payload, req, reference)
    if (currentTransaction?.status === 'succeeded') {
      const completedOrder = await findOrder(payload, req, getPaystackOrderID(reference))
      if (completedOrder) {
        const customerEmail = completedOrder.customerEmail || currentTransaction.customerEmail
        if (!customerEmail) throw new Error('Customer email is missing from the completed order')
        return {
          status: 'succeeded',
          orderID: completedOrder.id,
          customerEmail,
          ...(completedOrder.accessToken ? { accessToken: completedOrder.accessToken } : {}),
        }
      }
    }
    return { status: 'pending' }
  }

  try {
    const orderID = getPaystackOrderID(reference)
    let order = await findOrder(payload, req, orderID)
    let isNewOrder = false

    if (order && order.paystackReference !== reference) {
      throw new Error('Payment reference collided with an existing order identifier')
    }

    if (!order) {
      const customerEmail = transaction.customerEmail
      if (!customerEmail) throw new Error('Customer email is missing from the transaction')

      const orderData = {
        id: orderID,
        amount: transaction.amount,
        currency: transaction.currency,
        ...(transaction.customer ? { customer: transaction.customer } : {}),
        customerEmail,
        items: transaction.items ?? [],
        shippingAddress: transaction.shippingAddress ?? transaction.billingAddress ?? undefined,
        status: 'processing' as const,
        transactions: [transaction.id],
        paystackReference: reference,
      }

      try {
        order = await withWriteConflictRetry(() =>
          payload.create({
            collection: 'orders',
            data: orderData,
            depth: 0,
            overrideAccess: true,
            req,
          }),
        )
        isNewOrder = true
      } catch (error) {
        const duplicateKeyError =
          typeof error === 'object' && error !== null && 'code' in error && error.code === 11000

        if (!duplicateKeyError) throw error
        order = await findOrder(payload, req, orderID)
        if (!order) throw error
      }
    }

    const customerEmail = order.customerEmail || transaction.customerEmail
    if (!customerEmail) throw new Error('Customer email is missing from the order')

    if (isNewOrder) {
      for (const item of transaction.items ?? []) {
        const inventoryCollection = item.variant ? 'variants' : 'products'
        const productID =
          typeof item.variant === 'object' && item.variant
            ? item.variant.id
            : typeof item.variant === 'string'
              ? item.variant
              : typeof item.product === 'object' && item.product
                ? item.product.id
                : item.product

        if (productID) {
          await withWriteConflictRetry(() =>
            payload.db.updateOne({
              collection: inventoryCollection,
              data: {
                inventory: {
                  $inc: item.quantity * -1,
                },
              },
              id: productID,
              req,
            }),
          )
        }
      }
    }

    const cartID =
      typeof transaction.cart === 'object' && transaction.cart
        ? transaction.cart.id
        : transaction.cart

    if (cartID) {
      await withWriteConflictRetry(() =>
        payload.update({
          collection: 'carts',
          data: {
            items: [],
            purchasedAt: new Date().toISOString(),
          },
          id: cartID,
          overrideAccess: true,
          req,
        }),
      )
    }

    await withWriteConflictRetry(() =>
      payload.update({
        collection: 'transactions',
        data: {
          order: order.id,
          status: 'succeeded',
          paystack: {
            ...transaction.paystack,
            status: 'succeeded',
          },
        },
        id: transaction.id,
        overrideAccess: true,
        req,
      }),
    )

    // await enqueueOrderEmails(payload, req, order.id)

    try {
      const completeOrder = await payload.findByID({ collection: 'orders', id: order.id, depth: 2 })

      // Existing: send to customer
      const emailHtml = await OrderConfirmationEmailHtml({ order: completeOrder })
      await payload.sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - #${order.id.slice(0, 8).toUpperCase()}`,
        html: emailHtml,
      })

      // New: send to admin
      const adminEmailHtml = await AdminOrderNotificationEmailHtml({ order: completeOrder })
      await payload.sendEmail({
        to: process.env.ADMIN_EMAIL!, // add this to your .env
        subject: `New Order #${order.id.toUpperCase()} - ${formatPrice(order.amount ?? 0, order.currency ?? 'NGN')}`,
        html: adminEmailHtml,
      })
    } catch (emailError) {
      payload.logger.error(emailError, 'Failed to send order emails')
    }

    return {
      status: 'succeeded',
      orderID: order.id,
      customerEmail,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }
  } finally {
    try {
      await releasePaymentFinalization(payload, transaction.id, lockToken)
    } catch (error) {
      payload.logger.error(
        { err: error, transactionID: transaction.id },
        'Unable to release Paystack finalization lock',
      )
    }
  }
}

export async function sendOrderEmails({
  orderID,
  payload,
  req,
}: {
  orderID: string
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  const order = await payload.findByID({
    collection: 'orders',
    depth: 2,
    id: orderID,
    overrideAccess: true,
    req,
  })
  if (!order) throw new Error(`Order ${orderID} was not found`)

  const customerEmail = order.customerEmail
  if (!customerEmail) throw new Error(`Order ${orderID} has no customer email`)

  if (!order.receiptEmailSentAt) {
    const html = await OrderConfirmationEmailHtml({ order })
    await payload.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - #${order.id.slice(0, 8).toUpperCase()}`,
      html,
    })
    await payload.update({
      collection: 'orders',
      data: { receiptEmailSentAt: new Date().toISOString() },
      id: order.id,
      overrideAccess: true,
      req,
    })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is required to deliver the order notification')
  }

  if (!order.adminNotificationSentAt) {
    const html = await AdminOrderNotificationEmailHtml({ order })
    await payload.sendEmail({
      to: adminEmail,
      subject: `New Order #${order.id.toUpperCase()} - ${formatPrice(order.amount ?? 0, order.currency ?? 'NGN')}`,
      html,
    })
    await payload.update({
      collection: 'orders',
      data: { adminNotificationSentAt: new Date().toISOString() },
      id: order.id,
      overrideAccess: true,
      req,
    })
  }
}
