'use client'

import { Button } from '@/components/ui/button'
import type { Product } from '@/payload-types'

import { useAddToCart } from '@/hooks/useAddToCart'
import { cn } from '@/utilities/cn'

type Props = {
  className?: string
  product: Partial<Product>
}

export function QuickAddButton({ className, product }: Props) {
  const hasVariants = Boolean(product.enableVariants)

  const { addToCart, disabled, isLoading } = useAddToCart({
    product,
    // No variant is ever pre-selected here — quick add only ever
    // adds exactly what the shopper asked for.
    variant: undefined,
  })

  const sharedClassName = cn(
    // Entrance: slides up from the bottom of the card on card hover/focus.
    'group/btn pointer-events-none absolute inset-x-3 bottom-3 translate-y-[150%] opacity-0',
    'isolate overflow-hidden rounded-none bg-primary-foreground font-archivo text-[14px] font-bold uppercase tracking-widest text-primary',
    // Single transition declaration covers transform, opacity, AND color —
    // don't add a second transition-* utility here, it'll override this one.
    'transition-all duration-300 ease-out',
    'group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100',
    'group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100',
    className,
  )

  const fill = (
    <span
      aria-hidden
      className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-primary transition-transform duration-300 ease-out group-hover/btn:scale-y-100"
    />
  )

  if (hasVariants) {
    return (
      <Button
        aria-label="Select options"
        className={cn(sharedClassName, 'py-4 hover:text-black')}
        size="sm"
        type="button"
        variant="outline"
      >
        {fill}
        <span className="relative">Select Options</span>
      </Button>
    )
  }

  return (
    <Button
      aria-label="Quick add to cart"
      className={cn(sharedClassName, 'py-4 hover:text-black')}
      disabled={disabled || isLoading}
      onClick={addToCart}
      size="sm"
      type="button"
      variant="outline"
    >
      {fill}
      <span className="relative">Quick Add</span>
    </Button>
  )
}
