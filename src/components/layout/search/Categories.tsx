import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { FilterList } from './filter'
import { CategoryItem } from './Categories.client'
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'

async function CategoryList() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
  })

  return (
    <div>
      <AccordionTrigger>
        <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Categories</h3>
      </AccordionTrigger>

      <AccordionContent>
        <ul>
          {categories.docs.map((category) => {
            return (
              <li key={category.id}>
                <CategoryItem category={category} />
              </li>
            )
          })}
        </ul>
      </AccordionContent>
    </div>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function Categories() {
  return (
    <Suspense
      fallback={
        <>
          <AccordionTrigger>
            <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Categories</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="col-span-2 hidden h-50 w-full flex-none py-4 lg:block">
              <div className={clsx(skeleton, activeAndTitles)} />
              <div className={clsx(skeleton, items)} />
              <div className={clsx(skeleton, items)} />
              <div className={clsx(skeleton, items)} />
              <div className={clsx(skeleton, items)} />
            </div>
          </AccordionContent>
        </>
      }
    >
      <CategoryList />
    </Suspense>
  )
}
