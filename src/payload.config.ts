import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { handlePaystackWebhook, plugins } from './plugins'
import { Posts } from './collections/Post'
import { sendOrderEmailsTask } from './jobs/sendOrderEmails'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    meta: {
      icons: [
        {
          rel: 'icon',
          sizes: '64x64',
          type: 'image/png',
          url: '/favicon.png',
        },
        {
          rel: 'shortcut icon',
          sizes: '64x64',
          type: 'image/x-icon',
          url: '/favicon.ico',
        },
      ],
    },
    components: {
      graphics: {
        Icon: '@/components/Logo#AdminLogoIcon',
        Logo: '@/components/Logo#AdminLogo',
      },

      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  collections: [Users, Pages, Posts, Categories, Media],
  db: mongooseAdapter({
    allowIDOnCreate: true,
    url: process.env.DATABASE_URL || '',
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  email: resendAdapter({
    defaultFromAddress: 'info@stereoluxury.ng',
    defaultFromName: 'Stereo Luxury',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  endpoints: [
    {
      method: 'post',
      path: '/paystack/webhooks',
      handler: handlePaystackWebhook,
    },
  ],
  globals: [Header, Footer],
  jobs: {
    enableConcurrencyControl: true,
    access: {
      run: ({ req }) => {
        const jobsToken = process.env.PAYLOAD_JOBS_TOKEN
        return Boolean(jobsToken && req.headers.get('authorization') === `Bearer ${jobsToken}`)
      },
    },
    tasks: [sendOrderEmailsTask],
  },
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
