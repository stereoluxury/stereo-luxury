import type { Cart } from '@/payload-types'
import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { flattenCart } from '../../src/lib/cartSnapshot'

const createCart = (variant?: string): Cart => ({
  id: 'cart-1',
  createdAt: '2026-10-20T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
  items: [
    {
      product: 'product-1',
      ...(variant ? { variant } : {}),
      quantity: 2,
    },
  ],
})

describe('flattenCart', () => {
  it('loads product prices directly and stores them in the snapshot', async () => {
    const findByID = vi.fn().mockResolvedValue({
      priceInNGN: 125000,
      costPriceInNGN: 50000,
    })
    const payload = { findByID } as unknown as Payload

    const items = await flattenCart(createCart(), 'NGN', payload)

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        id: 'product-1',
        select: { priceInNGN: true, costPriceInNGN: true },
      }),
    )
    expect(items[0]).toMatchObject({
      product: 'product-1',
      quantity: 2,
      unitPrice: 125000,
      unitCostPrice: 50000,
    })
  })

  it('uses the variant price when a cart item has a variant', async () => {
    const findByID = vi.fn(({ collection }: { collection: string }) =>
      Promise.resolve(
        collection === 'products'
          ? { priceInNGN: 125000, costPriceInNGN: 50000 }
          : { priceInNGN: 175000 },
      ),
    )
    const payload = { findByID } as unknown as Payload

    const items = await flattenCart(createCart('variant-1'), 'NGN', payload)

    expect(items[0]).toMatchObject({
      product: 'product-1',
      variant: 'variant-1',
      unitPrice: 175000,
      unitCostPrice: 50000,
    })
  })

  it('throws rather than snapshotting a missing product price as zero', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({ costPriceInNGN: 50000 }),
    } as unknown as Payload

    await expect(flattenCart(createCart(), 'NGN', payload)).rejects.toThrow(
      'Price field "priceInNGN" is missing or invalid.',
    )
  })
})
