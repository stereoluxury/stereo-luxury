import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { PayloadRequest, Plugin } from 'payload'

import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { ProductsCollection } from '@/collections/Products'
import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { normalizePaystackStatus } from '@/utilities/paystack'
import { currenciesConfig } from '@/lib/constants'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { HandleDelete, HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const VIDEO_EXTENSIONS = [
  'mp4',
  'mov',
  'avi',
  'wmv',
  'flv',
  'mkv',
  'webm',
  'm4v',
  'mpeg',
  'mpg',
  '3gp',
]
const RAW_EXTENSIONS = ['pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt']

function getResourceType(filename: string): 'image' | 'video' | 'raw' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (RAW_EXTENSIONS.includes(ext)) return 'raw'
  return 'image'
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',
  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    try {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`,
            overwrite: false,
            use_filename: true,
          },
          (error, result) => {
            if (error) return reject(error)
            if (!result) return reject(new Error('No result returned from Cloudinary'))
            resolve(result)
          },
        )
        uploadStream.end(file.buffer)
      })
      file.filename = uploadResult.public_id
      file.mimeType = `${uploadResult.format}`
      file.filesize = uploadResult.bytes
    } catch (err) {
      console.error('Upload Error', err)
    }
  },

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      const cleanName = filename.replace(/\.[^/.]+$/, '')
      await cloudinary.uploader.destroy(`media/${cleanName}`, {
        resource_type: getResourceType(filename), // <-- match how it was stored
      })
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },

  staticHandler(req: PayloadRequest) {
    if (!req.url) {
      return new Response('Bad request: missing URL', { status: 400 })
    }

    const url = new URL(req.url)
    const filename = url.pathname.split('/').pop()

    if (!filename) {
      return new Response('Filename not found', { status: 404 })
    }

    const resourceType = getResourceType(filename)

    const cloudinaryUrl = cloudinary.url(`media/${filename}`, {
      secure: true,
      resource_type: resourceType, // <-- this was the missing piece
      // image-only transformation — don't apply it to video/raw
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    })

    return Response.redirect(cloudinaryUrl, 302)
  },
})

const paystackAdapter = (): PaymentAdapter => ({
  name: 'paystack',
  label: 'Paystack',
  group: {
    name: 'paystack',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'paystack',
    },
    fields: [
      {
        name: 'reference',
        type: 'text',
        label: 'Paystack Reference',
      },
      {
        name: 'status',
        type: 'text',
        label: 'Paystack Status',
      },
    ],
  },
  async initiatePayment({ data, req, transactionsSlug }) {
    const payload = req.payload
    const { cart, customerEmail, billingAddress, shippingAddress } = data
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    const transactionsCollection = (transactionsSlug || 'transactions') as 'transactions'
    const resolvedCustomerEmail = (customerEmail ||
      (data as { email?: string }).email ||
      req.user?.email ||
      '') as string

    if (!secretKey) {
      throw new Error('Paystack secret key is required')
    }

    if (!cart || !cart.items?.length) {
      throw new Error('Cart is empty or not provided')
    }

    if (!resolvedCustomerEmail) {
      throw new Error('A valid customer email is required to make a purchase')
    }

    const flattenedCart = cart.items.map((item) => {
      const productID = typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined
      const { product: _product, variant: _variant, ...customProperties } = item

      return {
        ...customProperties,
        product: productID,
        quantity: item.quantity,
        ...(variantID ? { variant: variantID } : {}),
      }
    })

    const amount = cart.subtotal
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        email: resolvedCustomerEmail,
        callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm-order?email=${encodeURIComponent(resolvedCustomerEmail)}`,
        metadata: {
          cartID: cart.id,
          cartItemsSnapshot: JSON.stringify(flattenedCart),
          shippingAddress: JSON.stringify(shippingAddress || null),
          billingAddress: JSON.stringify(billingAddress || null),
        },
      }),
    })

    const json = await response.json()

    if (!response.ok || !json.status) {
      throw new Error(json.message || 'Unable to initialize Paystack payment')
    }

    const transaction = await payload.create({
      collection: transactionsCollection,
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail: resolvedCustomerEmail }),
        amount,
        billingAddress,
        cart: cart.id,
        currency: data.currency?.toUpperCase() || 'USD',
        items: flattenedCart,
        paymentMethod: 'paystack',
        status: 'pending',
        paystack: {
          reference: json.data.reference,
          status: 'pending',
        },
      } as any,
      req,
    })

    return {
      message: 'Payment initiated successfully',
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
      transactionID: transaction.id,
    }
  },
  async confirmOrder({ data, req, transactionsSlug }) {
    const payload = req.payload
    const paymentReference = data.paymentReference || data.reference
    const { cartsSlug = 'carts', ordersSlug = 'orders' } =
      (req?.payload?.config as { cartsSlug?: string; ordersSlug?: string } | undefined) || {}
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    const resolvedCustomerEmail = (data.customerEmail ||
      data.email ||
      req.user?.email ||
      '') as string
    const transactionsCollection = (transactionsSlug || 'transactions') as 'transactions'
    const ordersCollection = (ordersSlug || 'orders') as 'orders'
    const cartsCollection = (cartsSlug || 'carts') as 'carts'

    if (!secretKey) {
      throw new Error('Paystack secret key is required')
    }

    if (!paymentReference) {
      throw new Error('Paystack reference is required')
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const json = await response.json()

    if (!response.ok || !json.status) {
      throw new Error(json.message || 'Unable to verify Paystack payment')
    }

    const status = json.data.status
    const normalizedStatus = normalizePaystackStatus(status)

    const transactionsResults = await payload.find({
      collection: transactionsCollection,
      req,
      where: {
        'paystack.reference': {
          equals: paymentReference,
        },
      },
    })

    const transaction = transactionsResults.docs[0] as any

    if (!transactionsResults.totalDocs || !transaction) {
      throw new Error('No transaction found for the provided Paystack reference')
    }

    const cartID = transaction.cart?.id || transaction.cart
    const cartItemsSnapshot = transaction.items || []
    const shippingAddress = transaction.billingAddress || null

    if (!cartID) {
      throw new Error('Cart ID not found in the transaction metadata')
    }

    const order = await payload.create({
      collection: ordersCollection,
      data: {
        amount: transaction.amount,
        currency: transaction.currency,
        ...(req.user
          ? { customer: req.user.id }
          : { customerEmail: resolvedCustomerEmail || transaction.customerEmail }),
        items: cartItemsSnapshot,
        shippingAddress,
        status: normalizedStatus === 'succeeded' ? 'processing' : 'pending',
        transactions: [transaction.id],
      } as any,
      req,
    })

    await payload.update({
      id: cartID,
      collection: cartsCollection,
      data: {
        purchasedAt: new Date().toISOString(),
      } as any,
      req,
    })

    await payload.update({
      id: transaction.id,
      collection: transactionsCollection,
      data: {
        order: order.id,
        status: normalizedStatus,
        paystack: {
          ...(transaction.paystack || {}),
          status: normalizedStatus,
        },
      } as any,
      req,
    })

    return {
      message: 'Order confirmed successfully',
      orderID: order.id,
      transactionID: transaction.id,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }
  },
  endpoints: [
    {
      method: 'post',
      path: '/webhooks',
      handler: async (req) => {
        const body = req.json ? await req.json() : undefined
        const event = body?.event
        const reference = body?.data?.reference

        if (!reference || !event) {
          return Response.json(
            { success: false, message: 'Missing Paystack webhook payload' },
            { status: 400 },
          )
        }

        const payload = req.payload
        const transactionsResults = await payload.find({
          collection: 'transactions',
          req,
          where: {
            'paystack.reference': {
              equals: reference,
            },
          },
        })

        const transaction = transactionsResults.docs[0] as any

        if (transaction) {
          const normalizedStatus =
            event === 'charge.success'
              ? 'succeeded'
              : event === 'charge.failed'
                ? 'failed'
                : 'pending'

          await payload.update({
            id: transaction.id,
            collection: 'transactions',
            data: {
              status: normalizedStatus,
              paystack: {
                ...(transaction.paystack || {}),
                status: normalizedStatus,
              },
            } as any,
            req,
          })
        }

        return Response.json({ success: true })
      },
    },
  ],
})

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  cloudStoragePlugin({
    collections: {
      media: {
        adapter: cloudinaryAdapter,

        disableLocalStorage: true,

        generateFileURL: ({ filename }) => {
          return cloudinary.url(`media/${filename}`, {
            secure: true,
            resource_type: getResourceType(filename), // <-- fix here too
          })
        },
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
        ],
      }),
    },
    currencies: currenciesConfig,
    payments: {
      paymentMethods: [paystackAdapter()],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
  }),
]
