import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import {
  getCategoryByFullPath,
  getCategoryAndDescendantIds,
  resolveSelectedCategoryIds,
} from '@/utilities/categories'
import { Grid } from '@/components/Grid'
import { Pagination } from '@/components/Pagination'
import { ProductGridItem } from '@/components/ProductGridItem'

type Props = {
  params: Promise<{ slug: string; categories: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { slug: gender, categories: segments } = await params
  const { q: searchValue, sort, category, page } = await searchParams

  const currentCategory = await getCategoryByFullPath([gender, ...segments])
  if (!currentCategory || currentCategory.gender !== gender) notFound()

  const pathCategoryIds = await getCategoryAndDescendantIds(currentCategory.id)

  // If checkboxes selected specific sibling/child categories, intersect with
  // the path scope so a filter can only narrow, never escape the current section.
  const selectedCategoryIds = await resolveSelectedCategoryIds(category)
  const effectiveCategoryIds = selectedCategoryIds
    ? pathCategoryIds.filter((id) => selectedCategoryIds.includes(id))
    : pathCategoryIds

  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    page: page ? Number(page) : 1,
    select: {
      title: true,
      slug: true,
      gallery: true,
      inventory: true,
      categories: true,
      priceInUSD: true,
      priceInNGN: true,
      enableVariants: true,
      variantTypes: true,
    },
    sort: sort ? String(sort) : 'title',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { gender: { equals: gender } },
        { categories: { in: effectiveCategoryIds } },
        ...(searchValue
          ? [
              {
                or: [{ title: { like: searchValue } }, { description: { like: searchValue } }],
              },
            ]
          : []),
      ],
    },
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div className="uppercase tracking-widest">
      <nav className="mb-2 text-sm text-muted-foreground normal-case">
        {currentCategory.breadcrumbs?.map((b, i) => (
          <span key={b.url}>
            {i > 0 && ' / '}
            {b.label}
          </span>
        ))}
      </nav>
      <h1 className="text-2xl mb-4">{currentCategory.title}</h1>

      {searchValue ? (
        <p className="mb-4">
          {products.docs.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {products.docs.length === 0 && !searchValue && (
        <p className="mb-4">No products found in this category.</p>
      )}

      {products.docs.length > 0 && (
        <>
          <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.docs.map((product) => (
              <ProductGridItem key={product.id} product={product} />
            ))}
          </Grid>

          {products.totalPages > 1 && (
            <Pagination page={products.page ?? 1} totalPages={products.totalPages} useQueryParams />
          )}
        </>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: (await import('@payload-config')).default })
  const { docs } = await payload.find({
    collection: 'categories',
    where: { parent: { exists: true } },
    depth: 1,
    limit: 1000,
  })

  return docs
    .filter((c) => c.breadcrumbs?.length)
    .map((c) => {
      const parts = c.breadcrumbs!.at(-1)!.url!.split('/').filter(Boolean)
      return { slug: parts[0], categories: parts.slice(1) }
    })
}
