'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type ConfirmationResponse = {
  status?: 'pending' | 'failed' | 'succeeded'
  orderID?: string
  customerEmail?: string
  accessToken?: string
  message?: string
}

function isConfirmationResponse(value: unknown): value is ConfirmationResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!('status' in value) ||
      value.status === 'pending' ||
      value.status === 'failed' ||
      value.status === 'succeeded') &&
    (!('orderID' in value) || typeof value.orderID === 'string') &&
    (!('customerEmail' in value) || typeof value.customerEmail === 'string') &&
    (!('accessToken' in value) || typeof value.accessToken === 'string') &&
    (!('message' in value) || typeof value.message === 'string')
  )
}

export const ConfirmOrder: React.FC = () => {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const isConfirming = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const confirmPayment = useCallback(async () => {
    if (isConfirming.current) return
    isConfirming.current = true
    setIsLoading(true)
    setError(null)

    try {
      if (!reference) {
        throw new Error(
          'Payment reference was not returned. Please check your orders or contact support.',
        )
      }

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await fetch('/api/payments/paystack/confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
          cache: 'no-store',
          signal: AbortSignal.timeout(15_000),
        })
        const responseBody: unknown = await response.json()
        if (!isConfirmationResponse(responseBody)) {
          throw new Error('The payment service returned an invalid response.')
        }
        const result = responseBody

        if (response.status === 202 && result.status === 'pending') {
          if (attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 2_000))
            continue
          }
          throw new Error('Your payment is still processing. Please try again shortly.')
        }

        if (!response.ok || result.status !== 'succeeded' || !result.orderID) {
          throw new Error(
            result.status === 'failed'
              ? 'Paystack reports that this payment was not successful.'
              : result.message || 'Unable to confirm your payment. Please try again.',
          )
        }

        const query = new URLSearchParams()
        if (result.customerEmail) query.set('email', result.customerEmail)
        if (result.accessToken) query.set('accessToken', result.accessToken)
        const queryString = query.toString()

        const orderURL = `/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`
        window.location.replace(orderURL)
        return
      }
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : 'Unable to confirm your payment. Please try again.',
      )
    } finally {
      isConfirming.current = false
      setIsLoading(false)
    }
  }, [reference])

  useEffect(() => {
    void confirmPayment()
  }, [confirmPayment])

  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 text-center">
      <h1 className="text-2xl">{error ? 'Payment status' : 'Confirming order'}</h1>
      {isLoading ? (
        <LoadingSpinner className="h-6 w-12" />
      ) : error ? (
        <>
          <p role="status">{error}</p>
          <Button onClick={() => void confirmPayment()} type="button">
            Check payment status
          </Button>
        </>
      ) : (
        <p role="status">Your order is ready. Redirecting…</p>
      )}
    </div>
  )
}
