import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { Categories } from './Categories'
import { FilterList } from './filter'
import { sorting } from '@/lib/constants' // wherever `sorting` currently lives

export function FilterAccordion({
  defaultValue = 'item-1',
  gender,
  categorySegments,
}: {
  defaultValue?: string
  gender: string
  categorySegments?: string[]
}) {
  return (
    <Accordion defaultValue={defaultValue} type="single" collapsible>
      <AccordionItem value="item-1">
        <Categories gender={gender} categorySegments={categorySegments} />
      </AccordionItem>
      <AccordionItem value="item-3">
        <FilterList list={sorting} title="Sort by" />
      </AccordionItem>
    </Accordion>
  )
}
