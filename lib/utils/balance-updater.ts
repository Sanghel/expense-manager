import { insforgeAdmin } from '@/lib/insforge-admin'
import { convertAmount } from '@/lib/utils/exchange'
import { toNumber } from '@/lib/utils/numbers'

/**
 * Updates an account balance by adding or subtracting an amount,
 * converting currencies via exchange rates when necessary.
 *
 * @returns error message string on failure, null on success
 */
export async function applyBalanceDelta(
  accountId: string,
  amount: number,
  transactionCurrency: string,
  direction: 'add' | 'subtract'
): Promise<string | null> {
  const { data: account, error: fetchError } = await insforgeAdmin.database
    .from('accounts')
    .select('balance, currency')
    .eq('id', accountId)
    .single()

  if (fetchError || !account) {
    return `balance-fetch-error: ${JSON.stringify(fetchError)}`
  }

  const converted = await convertAmount(amount, transactionCurrency, account.currency)

  if (!converted.ok) {
    return `no-exchange-rate from=${transactionCurrency} to=${account.currency}`
  }

  const newBalance = direction === 'add'
    ? toNumber(account.balance) + converted.amount
    : toNumber(account.balance) - converted.amount

  const { error: updateError } = await insforgeAdmin.database
    .from('accounts')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', accountId)

  if (updateError) {
    return `balance-update-error: ${JSON.stringify(updateError)}`
  }

  return null
}
