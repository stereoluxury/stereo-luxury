'use client'

import type { Category } from '@/payload-types'
import { ClearFiltersButton } from './ClearFiltersButton'
import { FilterAccordion } from './FilterAccordion'
import { FiltersSheet } from './FilterSheet'

type Props = {
  categoryItems: { category: Pick<Category, 'id' | 'title'>; count: number }[]
  children: React.ReactNode
}

export function ShopFilters({ categoryItems, children }: Props) {
  return (
    <>
      <div className="flex md:hidden items-center justify-between gap-4">
        <FiltersSheet>
          <FilterAccordion categoryItems={categoryItems} />
          <ClearFiltersButton />
        </FiltersSheet>
        <ClearFiltersButton />
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-8">
        <div className="hidden md:flex w-full flex-none flex-col gap-4 md:gap-8 basis-1/5">
          <FilterAccordion categoryItems={categoryItems} />
          <ClearFiltersButton className="self-start" />
        </div>

        <div className="min-h-screen w-full">{children}</div>
      </div>
    </>
  )
}
