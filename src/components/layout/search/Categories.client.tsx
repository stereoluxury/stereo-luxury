'use client'
import React, { useCallback, useMemo } from 'react'

import { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Check } from 'lucide-react'

type Props = {
  category: Category
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [category.id, isActive, pathname, router, searchParams])

  return (
    <button
      aria-checked={isActive}
      role="checkbox"
      onClick={() => setQuery()}
      className="group flex items-center gap-2 py-1 hover:cursor-pointer"
    >
      <span
        className={clsx(
          'flex h-4 w-4 flex-none items-center justify-center border transition-colors',
          isActive
            ? 'border-primary-foreground bg-primary-foreground'
            : 'bg-transparent group-hover:border-primary-foreground/70',
        )}
      >
        <Check
          className={clsx(
            'h-3 w-3 text-primary transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0',
          )}
          strokeWidth={3}
        />
      </span>

      <span
        className={clsx('transition-colors uppercase tracking-widest font-bold', {
          'text-primary-foreground': isActive,
          'group-hover:text-primary-foreground': !isActive,
        })}
      >
        {category.title}
      </span>
    </button>
  )
}
