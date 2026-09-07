import { toNumber } from '@/lib/utils/numbers'
import type { Account, Currency, ExchangeRate } from '@/types/database.types'

/**
 * Sum of every account balance, converted into `preferredCurrency`.
 *
 * Returns null when there are no accounts, so callers can fall back to a
 * transaction-derived balance instead of showing a misleading zero.
 *
 * A missing rate leaves the amount unconverted — this is a display total, not
 * a persisted figure.
 */
export function getAccountsTotal(
  accounts: Account[],
  preferredCurrency: Currency,
  exchangeRates: ExchangeRate[]
): number | null {
  if (accounts.length === 0) return null

  return accounts.reduce((sum, account) => {
    const balance = toNumber(account.balance)
    if (account.currency === preferredCurrency) return sum + balance

    const rate = exchangeRates.find(
      (r) => r.from_currency === account.currency && r.to_currency === preferredCurrency
    )
    return sum + balance * (rate ? toNumber(rate.rate, 1) : 1)
  }, 0)
}
