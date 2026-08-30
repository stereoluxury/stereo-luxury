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
