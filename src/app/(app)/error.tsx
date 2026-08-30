'use client'

import { Button } from '@/components/ui/button'
import React from 'react'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col border border-neutral-200 bg-white p-8 md:p-12 dark:border-neutral-800 dark:bg-black uppercase tracking-widest">
      <h2 className="text-xl font-bold font-anton text-primary-foreground">Oh no!</h2>
      <p className="my-2">
        There was an issue with our storefront. This could be a temporary issue, please try your
        action again.
      </p>
      <Button
        className="mx-auto mt-4 flex w-full items-center justify-center p-4 tracking-widest rounded-none"
        onClick={() => reset()}
        type="button"
      >
        Try Again
      </Button>
    </div>
  )
}
