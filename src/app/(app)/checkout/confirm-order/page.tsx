import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Suspense } from 'react'
import { ConfirmOrder } from '@/components/checkout/ConfirmOrder'

export default function ConfirmOrderPage() {
  return (
    <div className="container min-h-[90vh] flex py-12">
      <Suspense fallback={<p className="w-full text-center">Checking payment status…</p>}>
        <ConfirmOrder />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Confirm order.',
  openGraph: mergeOpenGraph({
    title: 'Confirming order',
    url: '/checkout/confirm-order',
  }),
  title: 'Confirming order',
}
