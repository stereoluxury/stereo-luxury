import type { Cart, Product, Variant } from '@/payload-types'
import type { Payload } from 'payload'

export const getBasePrice = (source: Product | Variant | null, currency: string) => {
  if (!source) {
    throw new Error('Cannot snapshot a price without a product or variant.')
  }

  const key = `priceIn${currency}` as keyof typeof source
  const value = source[key]

  if (typeof value !== 'number') {
    throw new Error(`Price field "${key}" is missing or invalid.`)
  }

  return value
}

export const getProductId = (product?: (string | null) | Product) => {
  if (!product) return null
  return typeof product === 'object' ? product.id : product
}

export const getVariantId = (variant?: (string | null) | Variant) => {
  if (!variant) return null
  return typeof variant === 'object' ? variant.id : variant
}

export const getProductCostPrice = (product: Product | null, currency: string) => {
  if (!product) return 0
  const key = `costPriceIn${currency}` as keyof Product
  const value = product[key]
  return typeof value === 'number' ? value : 0
}

export const flattenCart = async (cart: Cart, currency: string, payload: Payload) =>
  Promise.all(
    (cart.items || []).map(async (item) => {
      const productID = getProductId(item.product)
      const variantID = getVariantId(item.variant)

      if (!productID) {
        throw new Error('Cannot snapshot a cart item without a product ID.')
      }

      const priceField = `priceIn${currency}`
      const costPriceField = `costPriceIn${currency}`
      const product = await payload.findByID({
        collection: 'products',
        id: productID,
        depth: 0,
        select: {
          [priceField]: true,
          [costPriceField]: true,
        },
      })
      const variant = variantID
        ? await payload.findByID({
            collection: 'variants',
            id: variantID,
            depth: 0,
            select: {
              [priceField]: true,
            },
          })
        : null

      // Variant price wins, otherwise fall back to the product price.
      const unitPrice = variant ? getBasePrice(variant, currency) : getBasePrice(product, currency)
      const unitCostPrice = getProductCostPrice(product, currency)

      const { product: _product, variant: _variant, ...customProperties } = item

      return {
        ...customProperties,
        product: productID,
        quantity: item.quantity,
        unitPrice,
        unitCostPrice,
        ...(variantID ? { variant: variantID } : {}),
      }
    }),
  )
