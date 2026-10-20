import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const normalizePaystackStatus = (status?: string | null) => {
  const normalized = (status || '').toLowerCase().trim()

  if (['success', 'successful', 'paid'].includes(normalized)) {
    return 'succeeded'
  }

  if (['failed', 'reversed', 'abandoned'].includes(normalized)) {
    return 'failed'
  }

  return 'pending'
}

export function getPaystackOrderID(reference: string): string {
  return createHash('sha256').update(reference).digest('hex').slice(0, 24)
}

export function isValidPaystackSignature(
  body: string,
  signature: string | null,
  secretKey: string,
): boolean {
  if (!signature || !/^[\da-f]{128}$/i.test(signature)) return false

  const expectedSignature = createHmac('sha512', secretKey).update(body).digest()
  const receivedSignature = Buffer.from(signature, 'hex')

  return timingSafeEqual(expectedSignature, receivedSignature)
}
