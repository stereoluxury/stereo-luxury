'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Address } from '@/payload-types'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter } from 'next/navigation'
import React, { FormEvent, useCallback } from 'react'

type Props = {
  customerEmail?: string
  billingAddress?: Partial<Address>
  shippingAddress?: Partial<Address>
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>
}

export const CheckoutForm: React.FC<Props> = ({
  customerEmail,
  billingAddress,
  setProcessingPayment,
}) => {
  const [error, setError] = React.useState<null | string>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { clearCart } = useCart()
  const { confirmOrder } = usePayments()

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setProcessingPayment(true)

      try {
        const returnUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm-order${customerEmail ? `?email=${customerEmail}` : ''}`
        const confirmResult = await confirmOrder('paystack', {
          additionalData: {
            ...(customerEmail ? { customerEmail } : {}),
            billingAddress,
            returnUrl,
          },
        })

        if (
          confirmResult &&
          typeof confirmResult === 'object' &&
          'orderID' in confirmResult &&
          confirmResult.orderID
        ) {
          const accessToken =
            'accessToken' in confirmResult ? (confirmResult.accessToken as string) : ''
          const queryParams = new URLSearchParams()

          if (customerEmail) {
            queryParams.set('email', customerEmail)
          }
          if (accessToken) {
            queryParams.set('accessToken', accessToken)
          }

          const queryString = queryParams.toString()
          const redirectUrl = `/orders/${confirmResult.orderID}${queryString ? `?${queryString}` : ''}`

          clearCart()
          router.push(redirectUrl)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        setError(`Error while submitting payment: ${msg}`)
        setIsLoading(false)
        setProcessingPayment(false)
      }
    },
    [
      setProcessingPayment,
      customerEmail,
      billingAddress?.phone,
      billingAddress?.addressLine1,
      billingAddress?.addressLine2,
      billingAddress?.city,
      billingAddress?.state,
      billingAddress?.postalCode,
      billingAddress?.country,
      confirmOrder,
      clearCart,
      router,
    ],
  )

  return (
    <form onSubmit={handleSubmit}>
      {error && <Message error={error} />}
      <div className="mt-8 flex gap-4">
        <Button disabled={isLoading} type="submit" variant="default">
          {isLoading ? 'Loading...' : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}
