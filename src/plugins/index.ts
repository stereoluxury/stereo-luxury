import { amountField, ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { defaultCountries } from '@payloadcms/plugin-ecommerce/client/react'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { PayloadRequest, Plugin } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { ProductsCollection } from '@/collections/Products'
import { currenciesConfig } from '@/lib/constants'
import { Address, Cart, Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { finalizePaystackPayment, markPaystackTransactionFailed } from '@/lib/payments/paystack'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { HandleDelete, HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { OrdersCollection } from '@/collections/Orders'
import { flattenCart } from '@/lib/cartSnapshot'
import { isValidPaystackSignature } from '@/utilities/paystack'

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

export async function handlePaystackWebhook(req: PayloadRequest): Promise<Response> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    req.payload.logger.error('Paystack secret key is not configured')
    return Response.json({ message: 'Payment service is unavailable' }, { status: 503 })
  }

  const rawBody = req.text ? await req.text() : ''
  if (!isValidPaystackSignature(rawBody, req.headers.get('x-paystack-signature'), secretKey)) {
    return Response.json({ message: 'Invalid Paystack signature' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return Response.json({ message: 'Invalid webhook body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('event' in body) ||
    typeof body.event !== 'string'
  ) {
    return Response.json({ message: 'Invalid Paystack webhook event' }, { status: 400 })
  }

  if (body.event !== 'charge.success' && body.event !== 'charge.failed') {
    return Response.json({ received: true })
  }

  if (
    !('data' in body) ||
    typeof body.data !== 'object' ||
    body.data === null ||
    !('reference' in body.data) ||
    typeof body.data.reference !== 'string'
  ) {
    return Response.json({ message: 'Paystack reference is missing' }, { status: 400 })
  }

  if (body.event === 'charge.failed') {
    try {
      await markPaystackTransactionFailed({
        payload: req.payload,
        req,
        reference: body.data.reference,
      })
      return Response.json({ received: true })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'Unable to update failed Paystack transaction')
      return Response.json({ message: 'Unable to process payment webhook' }, { status: 500 })
    }
  }

  try {
    const result = await finalizePaystackPayment({
      payload: req.payload,
      req,
      reference: body.data.reference,
    })
    if (result.status === 'pending') {
      return Response.json({ message: 'Payment verification is pending' }, { status: 503 })
    }
    return Response.json({ received: true })
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Unable to finalize Paystack webhook payment')
    return Response.json({ message: 'Unable to process payment webhook' }, { status: 500 })
  }
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
      { name: 'reference', type: 'text', label: 'Paystack Reference', index: true },
      { name: 'status', type: 'text', label: 'Paystack Status' },
    ],
  },
  async initiatePayment({ data, req, transactionsSlug }) {
    const payload = req.payload
    const paymentData = data as {
      billingAddress?: Partial<Address>
      cart?: Cart
      currency?: string
      customerEmail?: string
      email?: string
      shippingAddress?: Partial<Address>
    }
    const { cart, customerEmail, billingAddress, shippingAddress } = paymentData
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    const transactionsCollection = (transactionsSlug || 'transactions') as 'transactions'
    const resolvedCustomerEmail = (customerEmail || paymentData.email || req.user?.email || '')
      .trim()
      .toLowerCase()

    if (!secretKey) throw new Error('Paystack secret key is required')
    if (!cart || !cart.items?.length) throw new Error('Cart is empty or not provided')
    if (!resolvedCustomerEmail) {
      throw new Error('A valid customer email is required to make a purchase')
    }

    const currency = (paymentData.currency || cart.currency || 'NGN').toUpperCase()
    if (currency !== 'NGN' && currency !== 'USD') {
      throw new Error(`Unsupported Paystack currency: ${currency}`)
    }

    const amount = cart.subtotal
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      throw new Error('Cart total must be a positive integer in the configured currency unit')
    }

    const flattenedCart = await flattenCart(cart, currency, payload)
    const callbackURL = new URL('/checkout/confirm-order', getServerSideURL()).toString()
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        email: resolvedCustomerEmail,
        callback_url: callbackURL,
        metadata: { cartID: cart.id },
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const body: unknown = await response.json()
    if (
      !response.ok ||
      typeof body !== 'object' ||
      body === null ||
      !('status' in body) ||
      body.status !== true ||
      !('data' in body) ||
      typeof body.data !== 'object' ||
      body.data === null ||
      !('authorization_url' in body.data) ||
      typeof body.data.authorization_url !== 'string' ||
      !('reference' in body.data) ||
      typeof body.data.reference !== 'string'
    ) {
      const message =
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
          ? body.message
          : 'Unable to initialize Paystack payment'
      throw new Error(message)
    }

    const authorizationURL = new URL(body.data.authorization_url)
    if (authorizationURL.protocol !== 'https:') {
      throw new Error('Paystack returned an invalid checkout URL')
    }

    const transaction = await payload.create({
      collection: transactionsCollection,
      data: {
        ...(req.user ? { customer: req.user.id } : {}),
        customerEmail: resolvedCustomerEmail,
        amount,
        billingAddress,
        shippingAddress: shippingAddress ?? billingAddress,
        cart: cart.id,
        currency,
        items: flattenedCart,
        paymentMethod: 'paystack',
        status: 'pending',
        paystack: {
          reference: body.data.reference,
          status: 'pending',
        },
      },
      req,
    })

    return {
      message: 'Payment initiated successfully',
      authorizationUrl: authorizationURL.toString(),
      reference: body.data.reference,
      transactionID: transaction.id,
    }
  },
  async confirmOrder({ data, req }) {
    const paymentData = data as {
      paymentReference?: string
      reference?: string
    }
    const reference = paymentData.paymentReference || paymentData.reference
    if (!reference) throw new Error('Paystack reference is required')

    const result = await finalizePaystackPayment({
      payload: req.payload,
      req,
      reference,
    })
    if (result.status !== 'succeeded') {
      throw new Error(`Paystack payment is ${result.status}`)
    }

    return {
      message: 'Order confirmed successfully',
      orderID: result.orderID,
      // Payload decrements stock for truthy transaction IDs; the shared finalizer already did so.
      transactionID: '',
      ...(result.accessToken ? { accessToken: result.accessToken } : {}),
    }
  },
  endpoints: [
    {
      method: 'post',
      path: '/confirmation',
      handler: async (req) => {
        let body: unknown
        try {
          body = req.json ? await req.json() : undefined
        } catch {
          return Response.json({ message: 'Invalid request body' }, { status: 400 })
        }

        if (
          typeof body !== 'object' ||
          body === null ||
          !('reference' in body) ||
          typeof body.reference !== 'string'
        ) {
          return Response.json({ message: 'Paystack reference is required' }, { status: 400 })
        }

        try {
          const result = await finalizePaystackPayment({
            payload: req.payload,
            req,
            reference: body.reference,
          })
          return Response.json(result, {
            status: result.status === 'pending' ? 202 : result.status === 'failed' ? 402 : 200,
          })
        } catch (error) {
          req.payload.logger.error({ err: error }, 'Unable to confirm Paystack payment')
          return Response.json(
            { message: 'Unable to confirm payment. Please try again.' },
            { status: 502 },
          )
        }
      },
    },
    {
      method: 'post',
      path: '/webhooks',
      handler: handlePaystackWebhook,
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
    addresses: {
      supportedCountries: [...defaultCountries, { label: 'Nigeria', value: 'NG' }],
    },
    orders: {
      ordersCollectionOverride: OrdersCollection,
    },
    currencies: currenciesConfig,
    payments: {
      paymentMethods: [paystackAdapter()],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields.map((field) => {
            if (field.type !== 'tabs') return field

            return {
              ...field,
              tabs: field.tabs?.map((tab) => ({
                ...tab,
                fields: (tab.fields || []).map((tabField) => {
                  if (
                    !fieldAffectsData(tabField) ||
                    tabField.name !== 'items' ||
                    tabField.type !== 'array'
                  ) {
                    return tabField
                  }

                  return {
                    ...tabField,
                    fields: [
                      ...(tabField.fields || []),
                      amountField({
                        currenciesConfig,
                        overrides: {
                          name: 'unitPrice',
                          label: 'Unit Price',
                          defaultValue: 0,
                        },
                      }),
                      amountField({
                        currenciesConfig,
                        overrides: {
                          name: 'unitCostPrice',
                          label: 'Unit Cost Price',
                          defaultValue: 0,
                        },
                      }),
                    ],
                  }
                }),
              })),
            }
          }),
          {
            name: 'shippingAddress',
            type: 'group',
            fields: [
              { name: 'title', type: 'text' },
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
              { name: 'company', type: 'text' },
              { name: 'addressLine1', type: 'text' },
              { name: 'addressLine2', type: 'text' },
              { name: 'city', type: 'text' },
              { name: 'state', type: 'text' },
              { name: 'postalCode', type: 'text' },
              { name: 'country', type: 'text' },
              { name: 'phone', type: 'text' },
            ],
          },
          {
            name: 'finalizationLock',
            type: 'text',
            admin: { hidden: true },
          },
          {
            name: 'finalizationLockUntil',
            type: 'date',
            admin: { hidden: true },
          },
        ],
      }),
    },
  }),
]
