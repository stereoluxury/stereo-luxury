import { Search } from '@/components/Search'
import { FilterAccordion } from '@/components/layout/search/FilterAccordion'
import { ClearFiltersButton } from '@/components/layout/search/ClearFiltersButton'
import React, { Suspense } from 'react'
import { FiltersSheet } from '@/components/layout/search/FilterSheet'

type Props = {
  children: React.ReactNode
  params: Promise<{ slug: string; categories?: string[] }>
}

export default async function ShopLayout({ children, params }: Props) {
  const { slug: gender, categories } = await params

  console.log(gender, categories);
  

  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4">
        <Search className="mb-8" />

        <div className="flex md:hidden items-center justify-between gap-4">
          <FiltersSheet>
            <FilterAccordion gender={gender} categorySegments={categories} />
            <ClearFiltersButton />
          </FiltersSheet>
          <ClearFiltersButton />
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-8">
          <div className="hidden md:flex w-full flex-none flex-col gap-4 md:gap-8 basis-1/5">
            <FilterAccordion gender={gender} categorySegments={categories} />
            <ClearFiltersButton className="self-start" />
          </div>

          <div className="min-h-screen w-full">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
