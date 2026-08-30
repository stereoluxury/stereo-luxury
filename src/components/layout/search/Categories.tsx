import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { CategoryItem } from './Categories.client'
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import {
  buildCategoryTree,
  findCategoryByPath,
  getAllCategoriesFlat,
  parentId as _parentId,
} from '@/utilities/categories'

type Props = {
  gender: string
  categorySegments?: string[]
}

async function CategoryList({ gender, categorySegments }: Props) {
  const allCategories = await getAllCategoriesFlat()
  const { childrenByParent, getDescendantIds } = buildCategoryTree(allCategories)

  let children: typeof allCategories

  if (categorySegments?.length) {
    const current = findCategoryByPath(allCategories, [gender, ...categorySegments])
    if (!current) return null
    children = childrenByParent.get(String(current.id)) ?? []
  } else {
    const root = allCategories.find((c) => {
      const pid = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent
      return !pid && c.gender === gender && c.slug === gender
    })
    if (!root) return null
    children = childrenByParent.get(String(root.id)) ?? []
  }

  if (children.length === 0) return null

  const payload = await getPayload({ config: configPromise })

  const childrenWithCounts = await Promise.all(
    children.map(async (child) => {
      const ids = [String(child.id), ...getDescendantIds(String(child.id))]
      const { totalDocs } = await payload.count({
        collection: 'products',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { gender: { equals: gender } },
            { categories: { in: ids } },
          ],
        },
      })
      return { category: child, count: totalDocs }
    }),
  )

  // console.log(childrenWithCounts);
  

  return (
    <div>
      <AccordionTrigger className="hover:no-underline">
        <h3 className="text-lg tracking-wide mb-2 text-primary-foreground hover:text-primary-foreground/80 uppercase font-anton">
          Categories
        </h3>
      </AccordionTrigger>

      <AccordionContent>
        <ul>
          {childrenWithCounts.map(({ category, count }) => (
            <li key={category.id} className="font-archivo">
              <CategoryItem category={category} count={count} />
            </li>
          ))}
        </ul>
      </AccordionContent>
    </div>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function Categories(props: Props) {
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
      <CategoryList {...props} />
    </Suspense>
  )
}
