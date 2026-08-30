// types/navigation.ts
import type { Category, Media } from '@/payload-types'
import { CMSLinkType } from '../Link'

export type MegaMenuItem = {
  id: string
  type: 'megaMenu'
  megaMenu: {
    label: string
    rootCategory: Category
    featured?: {
      title: string
      image: Media
      link: Category
    }[]
    sections: {
      label: string
      categories: Category[]
    }[]
    showBrands?: boolean
  }
}

export type LinkNavItem = {
  id: string
  type: 'link'
  link: CMSLinkType
}

export type NavItem = LinkNavItem | MegaMenuItem
