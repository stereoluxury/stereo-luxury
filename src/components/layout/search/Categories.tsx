import configPromise from '@payload-config'
import clsx from 'clsx'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import { buildCategoryTree, findCategoryByPath, getAllCategoriesFlat } from '@/utilities/categories'
import { CategoryItem } from './Categories.client'

type Props = {
  audience: string
  categorySegments?: string[]
}

async function CategoryList({ audience, categorySegments }: Props) {
  const allCategories = await getAllCategoriesFlat()
  const { childrenByParent, getDescendantIds } = buildCategoryTree(allCategories)

  let children: typeof allCategories

  if (categorySegments?.length) {
    // Path-relative children. `categorySegments` are the URL segments after
    // the audience prefix (e.g. ['tops'] from /men/tops), matching the
    // plugin's taxonomy-relative breadcrumb URLs.
    const current = findCategoryByPath(allCategories, categorySegments)
    console.log(current, "current");
    
    if (!current) return null
    children = childrenByParent.get(String(current.id)) ?? []
  } else {
    // No segments → show top-level categories. In the audience model these
    // are the taxonomy roots (Tops, Bottoms, New, …). There is no per-gender
    // root category anymore, so we just take everything with no parent.
    children = allCategories.filter((c) => {
      const pid = typeof c.parent === 'object' && c.parent ? c.parent.id : c.parent
      return !pid
    })
  }

  if (children.length === 0) return null

  const payload = await getPayload({ config: configPromise })

  // 'new' is a virtual section, not an audience. For it, show counts across
  // all audiences; for men/women, scope counts to that audience.
  const isAudience = audience === 'men' || audience === 'women'

  const childrenWithCounts = await Promise.all(
    children.map(async (child) => {
      const ids = [String(child.id), ...getDescendantIds(String(child.id))]
      const { totalDocs } = await payload.count({
        collection: 'products',
        where: {
          and: [
            { _status: { equals: 'published' } },
            ...(isAudience ? [{ audiences: { in: [audience] } }] : []),
            { categories: { in: ids } },
          ],
        },
      })
      return { category: child, count: totalDocs }
    }),
  )

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
