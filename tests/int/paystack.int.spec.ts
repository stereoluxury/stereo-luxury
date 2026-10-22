import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  getPaystackOrderID,
  isValidPaystackSignature,
  normalizePaystackStatus,
} from '../../src/utilities/paystack'

describe('normalizePaystackStatus', () => {
  it('maps successful Paystack statuses to the app status', () => {
    expect(normalizePaystackStatus('success')).toBe('succeeded')
    expect(normalizePaystackStatus('successful')).toBe('succeeded')
  })

  describe('Paystack webhook signature validation', () => {
    const secret = 'test-secret'
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref-123' } })

    it('accepts a valid SHA-512 HMAC signature', () => {
      const signature = createHmac('sha512', secret).update(body).digest('hex')

      expect(isValidPaystackSignature(body, signature, secret)).toBe(true)
    })

    it('rejects missing, malformed, and tampered signatures', () => {
      const signature = createHmac('sha512', secret).update(body).digest('hex')

      expect(isValidPaystackSignature(body, null, secret)).toBe(false)
      expect(isValidPaystackSignature(body, 'invalid', secret)).toBe(false)
      expect(isValidPaystackSignature(`${body} `, signature, secret)).toBe(false)
    })
  })

  describe('getPaystackOrderID', () => {
    it('returns a stable Mongo-compatible ID for each Paystack reference', () => {
      const orderID = getPaystackOrderID('paystack-reference')

      expect(orderID).toMatch(/^[\da-f]{24}$/)
      expect(getPaystackOrderID('paystack-reference')).toBe(orderID)
      expect(getPaystackOrderID('another-reference')).not.toBe(orderID)
    })
  })

  it('maps failed and reversed statuses to a failed state', () => {
    expect(normalizePaystackStatus('failed')).toBe('failed')
    expect(normalizePaystackStatus('reversed')).toBe('failed')
  })
})
