import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateTag } from 'next/cache'
import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'topBanner',
      type: 'text',
      admin: { description: 'e.g. "Get free delivery on orders over $100"' },
    },
    {
      name: 'navItems',
      type: 'array',
      maxRows: 6,
      fields: [
        {
          name: 'type',
          type: 'radio',
          options: [
            { label: 'Simple Link', value: 'link' },
            { label: 'Mega Menu', value: 'megaMenu' },
          ],
          defaultValue: 'link',
          required: true,
        },
        link({
          appearances: false,
          overrides: {
            admin: { condition: (_: any, sibling: { type: string }) => sibling.type === 'link' },
          },
        }),
        {
          name: 'megaMenu',
          type: 'group',
          admin: { condition: (_, sibling) => sibling.type === 'megaMenu' },
          fields: [
            { name: 'label', type: 'text', required: true }, // "Men" / "Women"
            {
              name: 'rootCategory',
              type: 'relationship',
              relationTo: 'categories',
              filterOptions: { parent: { exists: false } },
              required: true,
              admin: { description: 'Which top-level category this tab points to' },
            },
            {
              name: 'featured',
              type: 'array',
              maxRows: 2,
              admin: { description: 'Promo tiles (e.g. "New Arrivals", "Basic Tees")' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'link', type: 'relationship', relationTo: 'categories', required: true },
              ],
            },
            {
              name: 'sections',
              type: 'array',
              maxRows: 4,
              admin: { description: 'A column in the flyout menu' },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  admin: {
                    description:
                      'Column heading, e.g. "Clothing" — free text, not tied to a category',
                  },
                },
                {
                  name: 'categories',
                  type: 'relationship',
                  relationTo: 'categories',
                  hasMany: true,
                  required: true,
                  admin: {
                    description: 'Pick the specific categories to list in this column, in order',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        revalidateTag('global_header', 'max')
      },
    ],
  },
}
