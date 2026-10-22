import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import type { Category } from '@/payload-types'
import { CategoryItem } from './Categories.client'
export function Categories({
  items,
}: {
  items: { category: Pick<Category, 'id' | 'title'>; count: number }[]
}) {
  if (items.length === 0) return null
  return (
    <div>
      <AccordionTrigger className="hover:no-underline">
        <h3 className="text-lg tracking-wide mb-2 text-primary-foreground hover:text-primary-foreground/80 uppercase font-anton">
          Categories
        </h3>
      </AccordionTrigger>

      <AccordionContent>
        <ul>
          {items.map(({ category, count }) => (
            <li key={category.id} className="font-archivo">
              <CategoryItem category={category} count={count} />
            </li>
          ))}
        </ul>
      </AccordionContent>
    </div>
  )
}
