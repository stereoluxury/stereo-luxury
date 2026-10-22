// types/navigation.ts
import type { Category, Media } from '@/payload-types'
import { CMSLinkType } from '../Link'

export type NavItem =
  | {
      id: string
      type: 'link'
      link: CMSLinkType
    }
  | {
      id: string
      type: 'megaMenu'
      megaMenu: {
        label: string
        audience: 'men' | 'women'
        featured?: Array<{
          id?: string
          title: string
          image: Media
          link: Category
        }>
        sections: Array<{
          id?: string
          label: string
          categories: Category[]
        }>
      }
    }
