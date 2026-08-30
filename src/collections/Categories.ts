import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',

  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },

  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
    },

    {
      name: 'description',
      type: 'textarea',
    },

    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },

    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Men', value: 'men' },
        { label: 'Women', value: 'women' },
        { label: 'Unisex', value: 'unisex' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Automatically inherited from the top-level category.',
      },

      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            // Top-level category
            if (!data?.parent) {
              return data?.gender
            }
            let parentId = typeof data.parent === 'object' ? data.parent.id : data.parent
            while (parentId) {
              const parent = await req.payload.findByID({
                collection: 'categories',
                id: parentId,
                depth: 0,
              })
              // We've reached the top-level category.
              if (!parent.parent) {
                return parent.gender
              }
              parentId = typeof parent.parent === 'object' ? parent.parent.id : parent.parent
            }
            return undefined
          },
        ],
      },
    },

    slugField(),
  ],
}
