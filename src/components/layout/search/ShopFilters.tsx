import { FilterAccordion } from './FilterAccordion'
import { ClearFiltersButton } from './ClearFiltersButton'
import { FiltersSheet } from './FilterSheet'

type Props = {
  gender: string
  categorySegments?: string[]
  children: React.ReactNode
}

export function ShopFilters({ gender, categorySegments, children }: Props) {
  return (
    <>
      <div className="flex md:hidden items-center justify-between gap-4">
        <FiltersSheet>
          <FilterAccordion gender={gender} categorySegments={categorySegments} />
          <ClearFiltersButton />
        </FiltersSheet>
        <ClearFiltersButton />
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-8">
        <div className="hidden md:flex w-full flex-none flex-col gap-4 md:gap-8 basis-1/5">
          <FilterAccordion gender={gender} categorySegments={categorySegments} />
          <ClearFiltersButton className="self-start" />
        </div>

        <div className="min-h-screen w-full">{children}</div>
      </div>
    </>
  )
}
