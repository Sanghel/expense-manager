import { toNumber } from '@/lib/utils/numbers'
import type { Currency } from '@/types/database.types'

export type RateRow = { from_currency: Currency; to_currency: Currency; rate: number }

export type Converter = (amount: number, from: Currency, to: Currency) => number

/**
 * Builds an in-memory converter from the latest stored rate pairs, so a batch
 * of rows can be converted without one query per row.
 *
 * A missing rate falls back to the raw amount — this is a read/display helper.
 * Write paths must use `convertAmount` from `lib/utils/exchange.ts`, which
 * fails instead of persisting a figure in the wrong currency.
 */
export function buildConverter(rates: RateRow[]): Converter {
  const map = new Map<string, number>()
  for (const r of rates) {
    if (r && r.from_currency && r.to_currency) {
      map.set(`${r.from_currency}_${r.to_currency}`, toNumber(r.rate))
    }
  }
  return (amount, from, to) => {
    const value = toNumber(amount)
    if (from === to) return value
    const rate = map.get(`${from}_${to}`)
    return rate ? value * rate : value
  }
}
