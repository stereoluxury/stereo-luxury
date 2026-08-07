import { Grid } from '@/components/Grid'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const SKELETON_COUNT = 6

export const ProductGridItemSkeleton: React.FC = () => {
  return (
    <div className="relative inline-block h-full w-full">
      <div className="relative overflow-hidden rounded-2xl">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/5" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div>
      <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <ProductGridItemSkeleton key={index} />
        ))}
      </Grid>
    </div>
  )
}
