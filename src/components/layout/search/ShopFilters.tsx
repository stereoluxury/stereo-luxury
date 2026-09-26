'use client'

import { FilterAccordion } from './FilterAccordion'
import { ClearFiltersButton } from './ClearFiltersButton'
import { FiltersSheet } from './FilterSheet'
import { useParams } from 'next/navigation'

type Props = {
  // audience: string
  // categorySegments?: string[]
  children: React.ReactNode
}

export function ShopFilters({ children }: Props) {
  const params = useParams<{
    slug: string

    categories?: string[]
  }>()

  const audience = params.slug
  const categories = params.categories
  return (
    <>
      <div className="flex md:hidden items-center justify-between gap-4">
        <FiltersSheet>
          <FilterAccordion audience={audience} categorySegments={categories} />
          <ClearFiltersButton />
        </FiltersSheet>
        <ClearFiltersButton />
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-8">
        <div className="hidden md:flex w-full flex-none flex-col gap-4 md:gap-8 basis-1/5">
          <FilterAccordion audience={audience} categorySegments={categories} />
          <ClearFiltersButton className="self-start" />
        </div>

        <div className="min-h-screen w-full">{children}</div>
      </div>
    </>
  )
}
