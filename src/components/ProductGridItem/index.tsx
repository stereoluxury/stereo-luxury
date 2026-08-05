import type { Product, Variant } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { QuickAddButton } from './QuickAddButton'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, priceInNGN, title } = product

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
      <div className="relative overflow-hidden rounded-2xl">
        {image ? (
          <Media
            className="relative aspect-square object-cover"
            height={80}
            imgClassName={clsx('h-full w-full rounded-2xl object-cover', {
              'transition duration-300 ease-in-out group-hover:scale-102': true,
            })}
            resource={image}
            width={80}
          />
        ) : null}

        <QuickAddButton product={product} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 font-archivo tracking-widest text-[#e2e2e2]">
        <div className="uppercase font-bold">{title}</div>

        {typeof price === 'number' && (
          <div className="">
            <Price amount={price} className='text-primary-foreground' />
          </div>
        )}
      </div>
    </Link>
  )
}
