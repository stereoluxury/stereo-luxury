import { USD } from '@payloadcms/plugin-ecommerce'
import { CurrenciesConfig, Currency } from '@payloadcms/plugin-ecommerce/types'
export { defaultSort, sorting } from './sorting'
export type { SortFilterItem } from './sorting'

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
