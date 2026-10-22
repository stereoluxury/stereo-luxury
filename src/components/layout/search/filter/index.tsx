import type { SortFilterItem } from '@/lib/sorting'

import React, { Suspense } from 'react'

import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import { FilterItem } from './FilterItem'
export type ListItem = PathFilterItem | SortFilterItem
export type PathFilterItem = { path: string; title: string }

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <React.Fragment>
      {list.map((item: ListItem, i) => (
        <FilterItem item={item} key={i} />
      ))}
    </React.Fragment>
  )
}

export function FilterList({ list, title }: { list: ListItem[]; title?: string }) {
  return (
    <React.Fragment>
      <nav>
        {title ? (
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-lg tracking-wide mb-2 text-primary-foreground hover:text-primary-foreground/80 uppercase font-anton">
              {title}
            </h3>
          </AccordionTrigger>
        ) : null}
        <AccordionContent>
          <ul className="">
            <Suspense fallback={null}>
              <FilterItemList list={list} />
            </Suspense>
          </ul>
        </AccordionContent>
      </nav>
    </React.Fragment>
  )
}
