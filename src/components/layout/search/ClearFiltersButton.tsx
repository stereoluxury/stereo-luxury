'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { createUrl } from '@/utilities/createUrl'

const FILTER_PARAM_KEYS = ['category', 'sort']

export function ClearFiltersButton({ className }: { className?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasActiveFilters = FILTER_PARAM_KEYS.some((key) => searchParams.has(key))

  if (!hasActiveFilters) return null

  const clearedParams = new URLSearchParams(searchParams.toString())
  FILTER_PARAM_KEYS.forEach((key) => clearedParams.delete(key))

  return (
    <Button
      asChild
    //   variant="ghost"
      className={clsx('gap-2 uppercase tracking-widest text-sm rounded-none', className)}
    >
      <Link href={createUrl(pathname, clearedParams)}>
        <X className="h-3.5 w-3.5" />
        Clear filters
      </Link>
    </Button>
  )
}
