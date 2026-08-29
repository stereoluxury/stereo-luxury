import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Category } from '@/payload-types'

export async function getTopLevelCategories(gender?: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'categories',
    where: {
      parent: { exists: false },
      ...(gender ? { gender: { equals: gender } } : {}),
    },
    sort: 'title',
    depth: 0,
  })
  return docs
}

// Resolve a category from the full URL path, e.g. ['men', 'tshirts']
export async function getCategoryByFullPath(segments: string[]): Promise<Category | null> {
  const payload = await getPayload({ config: configPromise })
  const leafSlug = segments[segments.length - 1]
  const targetPath = `/${segments.join('/')}`

  // slug alone can collide across different parents (Men/Tshirts vs Women/Tshirts),
  // so pull all matches and disambiguate by full breadcrumb path
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: leafSlug } },
    depth: 1,
    limit: 50,
  })

  return docs.find((doc) => doc.breadcrumbs?.at(-1)?.url === targetPath) ?? null
}

export async function getCategoryAndDescendantIds(categoryId: string): Promise<string[]> {
  const payload = await getPayload({ config: configPromise })
  const ids = [categoryId]

  const { docs: children } = await payload.find({
    collection: 'categories',
    where: { parent: { equals: categoryId } },
    limit: 100,
    depth: 0,
  })

  for (const child of children) {
    ids.push(...(await getCategoryAndDescendantIds(child.id)))
  }

  return ids
}

export async function getAllCategoriesFlat() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'categories',
    limit: 1000,
    depth: 0,
    sort: 'title',
  })
  return docs
}

export function parentId(c: Category) {
  return typeof c.parent === 'object' && c.parent !== null ? c.parent.id : c.parent
}

export function buildCategoryTree(categories: Category[]) {
  const childrenByParent = new Map<string, Category[]>()

  categories.forEach((c) => {
    const pid = parentId(c)
    if (pid) {
      const arr = childrenByParent.get(String(pid)) ?? []
      arr.push(c)
      childrenByParent.set(String(pid), arr)
    }
  })

  function getDescendantIds(id: string): string[] {
    const direct = childrenByParent.get(id) ?? []
    return direct.reduce<string[]>(
      (acc, child) => [...acc, String(child.id), ...getDescendantIds(String(child.id))],
      [],
    )
  }

  return { childrenByParent, getDescendantIds }
}

export function findCategoryByPath(categories: Category[], segments: string[]) {
  const targetPath = `/${segments.join('/')}`
  return categories.find((c) => c.breadcrumbs?.at(-1)?.url === targetPath) ?? null
}

export async function resolveSelectedCategoryIds(
  selected: string | string[] | undefined,
): Promise<string[] | null> {
  if (!selected) return null

  const ids = Array.isArray(selected) ? selected : [selected]
  const allCategories = await getAllCategoriesFlat()
  const { getDescendantIds } = buildCategoryTree(allCategories)

  const resolved = ids.flatMap((id) => [id, ...getDescendantIds(id)])
  return [...new Set(resolved)]
}