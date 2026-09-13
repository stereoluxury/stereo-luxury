import type { Block } from 'payload'

export const MediaCarouselBlock: Block = {
  slug: 'mediaCarousel',
  interfaceName: 'MediaCarouselBlock',
  labels: {
    singular: 'Media Carousel',
    plural: 'Media Carousels',
  },
  fields: [
    {
      name: 'autoplay',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable autoplay',
    },
    {
      name: 'delay',
      type: 'number',
      defaultValue: 2000,
      min: 500,
      admin: {
        description: 'Autoplay delay in milliseconds',
        condition: (_, siblingData) => siblingData?.autoplay,
      },
    },
    {
      name: 'slides',
      type: 'array',
      minRows: 1,
      labels: {
        singular: 'Slide',
        plural: 'Slides',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media', // change to your media collection slug if different
          required: true,
        },
        // {
        //   name: 'alt',
        //   type: 'text',
        // },
        // {
        //   name: 'caption',
        //   type: 'text',
        // },
      ],
    },
  ],
}
