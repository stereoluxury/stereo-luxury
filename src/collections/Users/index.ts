import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { publicAccess } from '@/access/publicAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { checkRole } from '@/access/utilities'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { ForgotPasswordEmailHtml } from '@/components/Emails/ForgotPasswordEmail'
import { getServerSideURL } from '@/utilities/getURL'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
    forgotPassword: {
      generateEmailHTML: async (args) => {
        // Generate the email HTML
        if (!args) {
          throw new Error('Invalid arguments')
        }
        if (!args.token) {
          throw new Error('Missing password reset token')
        }
        let resetURL: string
        if (args.user.roles?.includes('admin')) {
          const config = args.req?.payload.config
          if (!config) throw new Error('Payload request context is required for admin reset URL')
          resetURL = new URL(
            `${config.routes.admin}${config.admin.routes.reset}/${encodeURIComponent(args.token)}`,
            getServerSideURL(),
          ).toString()
        } else {
          resetURL = new URL(
            `/reset-password?token=${encodeURIComponent(args.token)}`,
            getServerSideURL(),
          ).toString()
        }

        const html = await ForgotPasswordEmailHtml({
          userEmail: args.user.email,
          resetURL,
        })
        return html
      },
      generateEmailSubject: () => {
        return 'Reset Your Password - Stereo Luxury'
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
  ],
}
