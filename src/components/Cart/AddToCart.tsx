'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useAddToCart } from '@/hooks/useAddToCart'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const searchParams = useSearchParams()
  const variants = product.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')

      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const { addToCart, disabled, isLoading } = useAddToCart({
    product,
    variant: selectedVariant,
  })

  return (
    <Button
      aria-label="Add to cart"
      variant={'outline'}
      className={clsx(
        'group relative isolate w-full max-w-80 overflow-hidden rounded-none border-primary-foreground bg-primary-foreground py-5 font-medium tracking-widest text-white transition-colors duration-300 ease-out hover:text-black',
      )}
      disabled={disabled || isLoading}
      onClick={addToCart}
      type="submit"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-y-100"
      />
      <span className="relative">Add To Cart</span>
    </Button>
  )
}
