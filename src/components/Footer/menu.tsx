import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import React from 'react'

interface Props {
  menu: Footer['navItems']
}

export function FooterMenu({ menu }: Props) {
  if (!menu?.length) return null

  return (
    <nav>
      <ul className="flex flex-wrap gap-4 font-medium text-sm md:gap-6">
        {menu.map((item) => {
          return (
            <li key={item.id}>
              <CMSLink appearance="link" className='hover:text-primary-foreground' {...item.link} />
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
