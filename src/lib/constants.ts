import { USD } from "@payloadcms/plugin-ecommerce"
import { CurrenciesConfig, Currency } from "@payloadcms/plugin-ecommerce/types"

export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'priceInNGN', reverse: false, title: 'Price: Low to high' }, // asc
  { slug: '-priceInNGN', reverse: true, title: 'Price: High to low' },
]

export const NGN: Currency = {
  code: 'NGN',
  decimals: 2,
  label: 'Naira',
  symbol: '₦',
}

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'NGN',
  supportedCurrencies: [NGN, USD],
}
