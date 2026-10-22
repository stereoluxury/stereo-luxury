import type { Category } from '@/payload-types'

export function categoryUrl(
  audience: string,
  category: Category | string | number | null | undefined,
): string {
  if (!category || typeof category !== 'object') return `/shop/${audience}`
  const path = category.breadcrumbs?.at(-1)?.url ?? ''
  return `/shop/${audience}${path}`
}

export function audienceUrl(audience: string): string {
  return `/shop/${audience}`
}
