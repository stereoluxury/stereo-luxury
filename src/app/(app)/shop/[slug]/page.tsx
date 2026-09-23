import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { resolveSelectedCategoryIds } from '@/utilities/categories'
import { Grid } from '@/components/Grid'
import { Pagination } from '@/components/Pagination'
import { ProductGridItem } from '@/components/ProductGridItem'

const VALID_GENDERS = ['men', 'women', 'unisex', 'new']
const NEW_ARRIVALS_CATEGORY_SLUG = 'new'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GenderShopPage({ params, searchParams }: Props) {
  const { slug: gender } = await params
  const { q: searchValue, sort, category, page } = await searchParams

  if (!VALID_GENDERS.includes(gender)) notFound()

  const isNewArrivals = gender === 'new'

  const payload = await getPayload({ config: configPromise })

  const selectedCategoryIds = await resolveSelectedCategoryIds(category)

  let newArrivalsCategoryId: string | number | undefined
  if (isNewArrivals) {
    const newCategory = await payload.find({
      collection: 'categories',
      where: { slug: { equals: NEW_ARRIVALS_CATEGORY_SLUG } },
      limit: 1,
      select: { title: true },
    })
    newArrivalsCategoryId = newCategory.docs[0]?.id
  }

  // men/women pages also include unisex products; unisex page stays unisex-only
  const genderValues = gender === 'men' || gender === 'women' ? [gender, 'unisex'] : [gender]

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
    sort: sort ? String(sort) : isNewArrivals ? '-createdAt' : 'title',
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(isNewArrivals
          ? newArrivalsCategoryId
            ? [{ categories: { in: [newArrivalsCategoryId] } }]
            : [{ id: { equals: -1 } }]
          : [{ gender: { in: genderValues } }]),
        ...(selectedCategoryIds ? [{ categories: { in: selectedCategoryIds } }] : []),
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
      <h1 className="text-2xl mb-4 uppercase font-anton text-primary-foreground">
        {isNewArrivals ? 'New Arrivals' : gender}
      </h1>

      {searchValue ? (
        <p className="mb-4">
          {products.docs.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {products.docs.length === 0 && !searchValue && (
        <p className="mb-4">No products found. Please try different filters.</p>
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

export function generateStaticParams() {
  return VALID_GENDERS.map((slug) => ({ slug }))
}
