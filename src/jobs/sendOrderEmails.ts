import type { TaskConfig } from 'payload'

import { sendOrderEmails } from '@/lib/payments/paystack'

type SendOrderEmailsTask = {
  input: {
    orderID: string
  }
  output: {
    completed: boolean
  }
}

export const sendOrderEmailsTask: TaskConfig<SendOrderEmailsTask> = {
  slug: 'sendOrderEmails',
  retries: 5,
  concurrency: ({ input }) => input.orderID,
  inputSchema: [
    {
      name: 'orderID',
      type: 'text',
      required: true,
    },
  ],
  outputSchema: [
    {
      name: 'completed',
      type: 'checkbox',
      required: true,
    },
  ],
  handler: async ({ input, req }) => {
    await sendOrderEmails({
      orderID: input.orderID,
      payload: req.payload,
      req,
    })

    return { output: { completed: true } }
  },
}
