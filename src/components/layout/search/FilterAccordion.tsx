import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Categories } from './Categories'
import { FilterList } from './filter'
import { sorting } from '@/lib/constants' // wherever `sorting` currently lives

export function FilterAccordion({
  defaultValue = 'item-1',
  audience,
  categorySegments,
}: {
  defaultValue?: string
  audience: string
  categorySegments?: string[]
}) {
  return (
    <Accordion defaultValue={defaultValue} type="single" collapsible>
      <AccordionItem value="item-1">
        <Categories audience={audience} categorySegments={categorySegments} />
      </AccordionItem>
      <AccordionItem value="item-3">
        <FilterList list={sorting} title="Sort by" />
      </AccordionItem>
    </Accordion>
  )
}