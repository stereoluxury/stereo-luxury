import { describe, expect, it } from 'vitest'

import { normalizePaystackStatus } from '../../src/utilities/paystack'

describe('normalizePaystackStatus', () => {
  it('maps successful Paystack statuses to the app status', () => {
    expect(normalizePaystackStatus('success')).toBe('succeeded')
    expect(normalizePaystackStatus('successful')).toBe('succeeded')
  })

  it('maps failed and reversed statuses to a failed state', () => {
    expect(normalizePaystackStatus('failed')).toBe('failed')
    expect(normalizePaystackStatus('reversed')).toBe('failed')
  })
})
