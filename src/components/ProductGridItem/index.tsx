import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'
import { QuickAddButton } from './QuickAddButton'

type Props = {
  product: Partial<Product>
}

function isOutOfStock(product: Partial<Product>): boolean {
  if (product.enableVariants) {
    const variantDocs = product.variants?.docs
    if (!variantDocs || variantDocs.length === 0) return false
    // Out of stock only if ALL variants are sold out
    return variantDocs.every((v) => {
      if (typeof v !== 'object') return false
      const inv = v.inventory
      return typeof inv === 'number' ? inv <= 0 : inv == null
    })
  }
  // Non-variant: check the product's own inventory field
  const inv = product.inventory
  
  return typeof inv === 'number' ? inv <= 0 : false
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, priceInNGN, title } = product
  const outOfStock = isOutOfStock(product)  

  let price = priceInNGN

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInNGN &&
      typeof variant.priceInNGN === 'number'
    ) {
      price = variant.priceInNGN
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link className="group relative inline-block h-full w-full" href={`/products/${product.slug}`}>
      <div className="relative overflow-hidden rounded-none">
        {image ? (
          <Media
            className="relative aspect-square object-cover"
            height={80}
            imgClassName={clsx('h-full w-full rounded-none object-cover', {
              'transition duration-300 ease-in-out group-hover:scale-102': true,
            })}
            resource={image}
            width={80}
          />
        ) : null}

        {/* Out of stock overlay badge */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-end justify-start p-3 pointer-events-none">
            <span className="bg-black/70 text-white text-xs font-archivo tracking-widest uppercase px-2 py-1">
              Out of Stock
            </span>
          </div>
        )}

        {!outOfStock && <QuickAddButton product={product} />}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 font-archivo tracking-widest text-[#e2e2e2]">
        <div className={`uppercase font-bold ${outOfStock ? 'opacity-50' : ''}`}>{title}</div>
        {typeof price === 'number' && (
          <div className={outOfStock ? 'opacity-50' : ''}>
            <Price amount={price} className="text-primary-foreground" />
          </div>
        )}
      </div>
    </Link>
  )
}
