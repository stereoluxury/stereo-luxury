// ShopLayout
import { Search } from '@/components/Search'
import { FilterAccordion } from '@/components/layout/search/FilterAccordion'
import { ClearFiltersButton } from '@/components/layout/search/ClearFiltersButton'
import React, { Suspense } from 'react'
import { FiltersSheet } from '@/components/layout/search/FilterSheet'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4">
        <Search className="mb-8" />

        {/* Mobile filter controls */}
        <div className="flex md:hidden items-center justify-between gap-4">
          <FiltersSheet>
            <FilterAccordion />
            <ClearFiltersButton />
          </FiltersSheet>
          <ClearFiltersButton />
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-8">
          {/* Desktop / tablet sidebar */}
          <div className="hidden md:flex w-full flex-none flex-col gap-4 md:gap-8 basis-1/5">
            <FilterAccordion />
            <ClearFiltersButton className="self-start" />
          </div>

          <div className="min-h-screen w-full">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
