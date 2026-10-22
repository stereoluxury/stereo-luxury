'use client'

import { Grid } from '@/components/Grid'
import { Skeleton } from '@/components/ui/skeleton'
import { useParams } from 'next/navigation'

const SKELETON_COUNT = 6
const FILTER_ROW_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3']

function ProductGridItemSkeleton() {
  return (
    <div className="relative inline-block h-full w-full">
      <div className="relative overflow-hidden rounded-none">
        <Skeleton className="aspect-square w-full rounded-none" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 font-archivo tracking-widest">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/5" />
      </div>
    </div>
  )
}

function FilterSectionSkeleton({ rows }: { rows: number }) {
  return (
    <section>
      <Skeleton className="mb-4 h-6 w-28" />
      <ul className="space-y-3">
        {Array.from({ length: rows }).map((_, itemIndex) => (
          <li key={itemIndex} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 flex-none" />
            <Skeleton
              className={`h-4 ${FILTER_ROW_WIDTHS[itemIndex % FILTER_ROW_WIDTHS.length]}`}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Loading() {
  const { categories } = useParams<{ categories?: string[] }>()

  return (
    <div>
      <div className="flex md:hidden items-center justify-between gap-4">
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-8">
        <aside className="hidden w-full flex-none basis-1/5 flex-col gap-4 md:flex md:gap-8">
          <FilterSectionSkeleton rows={5} />
          <FilterSectionSkeleton rows={4} />
        </aside>

        <div className="min-h-screen w-full uppercase tracking-widest">
          {categories?.length ? (
            <div className="mb-2">
              <Skeleton className="h-4 w-48" />
            </div>
          ) : null}
          <Skeleton className="mb-4 h-8 w-40" />

          <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: SKELETON_COUNT }).map((_, itemIndex) => (
              <ProductGridItemSkeleton key={itemIndex} />
            ))}
          </Grid>

          <div className="mt-8 flex justify-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>
    </div>
  )
}
