import { insforgeAdmin } from '@/lib/insforge-admin'

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

  let amt = Number(amount)

  if (transactionCurrency !== account.currency) {
    const { data: rate } = await insforgeAdmin.database
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', transactionCurrency)
      .eq('to_currency', account.currency)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (!rate) {
      return `no-exchange-rate from=${transactionCurrency} to=${account.currency}`
    }

    amt = amt * Number(rate.rate)
  }

  const newBalance = direction === 'add'
    ? Number(account.balance) + amt
    : Number(account.balance) - amt

  const { error: updateError } = await insforgeAdmin.database
    .from('accounts')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', accountId)

  if (updateError) {
    return `balance-update-error: ${JSON.stringify(updateError)}`
  }

  return null
}
