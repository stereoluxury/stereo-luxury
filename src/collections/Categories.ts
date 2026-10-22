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
    useAsTitle: 'slug',
    group: 'Ecommerce',
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          async ({ data, req, originalDoc }) => {
            const title = data?.title ?? originalDoc?.title
            if (!title) return data?.slug

            const base = title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')

            const parentId = typeof data?.parent === 'object' ? data?.parent?.id : data?.parent

            if (!parentId) return base

            const parent = await req.payload.findByID({
              collection: 'categories',
              id: parentId,
              depth: 0,
            })

            return `${parent.slug}/${base}` // e.g. tops/t-shirts
          },
        ],
      },
    },
  ],
}
