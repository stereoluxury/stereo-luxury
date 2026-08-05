'use client'

import type { Product, Variant } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

type UseAddToCartArgs = {
  product: Partial<Product>
  variant?: Variant
}

export function useAddToCart({ product, variant }: UseAddToCartArgs) {
  const { addItem, cart, isLoading } = useCart()

  const addToCart = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault()
      e?.stopPropagation()

      if (!product.id) return

      addItem({
        product: product.id,
        variant: variant?.id ?? undefined,
      }).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, variant],
  )

  const disabled = useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === variant?.id
        }
        return true
      }
      return false
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity

      if (product.enableVariants) {
        return existingQuantity >= (variant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!variant) return true
      if (variant.inventory === 0) return true
    } else {
      if (product.inventory === 0) return true
    }

    return false
  }, [variant, cart?.items, product])

  return { addToCart, disabled, isLoading }
}
