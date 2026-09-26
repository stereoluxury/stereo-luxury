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

const VALID_AUDIENCES = ['men', 'women'] as const
type Audience = (typeof VALID_AUDIENCES)[number]

type Props = {
  params: Promise<{ slug: string; categories: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { slug: audience, categories: segments } = await params
  const { q: searchValue, sort, category, page } = await searchParams

  if (!VALID_AUDIENCES.includes(audience as Audience)) notFound()

  const currentCategory = await getCategoryByFullPath(segments)

  if (!currentCategory) notFound()

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
        { audiences: { in: [audience] } },
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
  const audienceLabel = audience === 'men' ? 'Men' : 'Women'

  // Build breadcrumbs with the audience prefix applied at render time.
  // nestedDocsPlugin gives us category-relative URLs (/tops, /tops/t-shirts);
  // we prepend /{audience} so links land on the right storefront section.
  const breadcrumbs = [
    { url: `/${audience}`, label: audienceLabel },
    ...(currentCategory.breadcrumbs ?? []).map((b) => ({
      url: `/${audience}${b.url}`,
      label: b.label,
    })),
  ]

  return (
    <div className="uppercase tracking-widest">
      <nav className="mb-2 text-sm text-muted-foreground normal-case">
        {breadcrumbs.map((b, i) => (
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
    depth: 0,
    limit: 1000,
  })

  // Cross-product every category path with every audience.
  // Top-level categories are now reachable (e.g. /men/tops), so we no longer
  // filter to only categories that have a parent.
  return VALID_AUDIENCES.flatMap((audience) =>
    docs
      .filter((c) => typeof c.slug === 'string' && c.slug.length > 0)
      .map((c) => ({
        slug: audience,
        categories: (c.slug as string).split('/').filter(Boolean),
      })),
  )
}
