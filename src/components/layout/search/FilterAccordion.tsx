import { Categories } from '@/components/layout/search/Categories'
import { FilterList } from '@/components/layout/search/filter'
import { sorting } from '@/lib/constants'
import { Accordion, AccordionItem } from '@/components/ui/accordion'

export function FilterAccordion({ defaultValue = 'item-1' }: { defaultValue?: string }) {
  return (
    <Accordion defaultValue={defaultValue} type="single" collapsible>
      <AccordionItem value="item-1">
        <Categories />
      </AccordionItem>
      <AccordionItem value="item-3">
        <FilterList list={sorting} title="Sort by" />
      </AccordionItem>
    </Accordion>
  )
}
