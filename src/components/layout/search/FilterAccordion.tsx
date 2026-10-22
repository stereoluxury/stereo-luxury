import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { sorting } from '@/lib/sorting'
import type { Category } from '@/payload-types'
import { Categories } from './Categories'
import { FilterList } from './filter'

export function FilterAccordion({
  defaultValue = 'item-1',
  categoryItems,
}: {
  defaultValue?: string
  categoryItems: { category: Pick<Category, 'id' | 'title'>; count: number }[]
}) {
  return (
    <Accordion defaultValue={defaultValue} type="single" collapsible>
      <AccordionItem value="item-1">
        <Categories items={categoryItems} />
      </AccordionItem>
      <AccordionItem value="item-3">
        <FilterList list={sorting} title="Sort by" />
      </AccordionItem>
    </Accordion>
  )
}
