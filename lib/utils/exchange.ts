import { insforgeAdmin } from '@/lib/insforge-admin'
import { toNumber } from '@/lib/utils/numbers'

export type ConversionResult =
  | { ok: true; amount: number }
  | { ok: false; error: string }

/**
 * Latest stored rate for a currency pair, or null when none exists.
 */
export async function getExchangeRate(
  from: string,
  to: string
): Promise<number | null> {
  if (from === to) return 1

  const { data, error } = await insforgeAdmin.database
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const rate = toNumber(data.rate, 0)
  return rate > 0 ? rate : null
}

/**
 * Converts an amount between currencies.
 *
 * Unlike `convertCurrency` in `lib/actions/exchangeRates.actions.ts`, a missing
 * rate is an error rather than a silent pass-through of the unconverted amount.
 * Write paths must never persist a USD figure into a COP balance.
 */
export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<ConversionResult> {
  const value = toNumber(amount)

  if (from === to) return { ok: true, amount: value }

  const rate = await getExchangeRate(from, to)
  if (rate === null) {
    return { ok: false, error: `No hay tasa de cambio ${from} → ${to}` }
  }

  return { ok: true, amount: value * rate }
}
