'use server'

import { insforge } from '@/lib/insforge'

export async function getLatestRates() {
  try {
    const { data, error } = await insforge.database
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(10)

    if (error) throw error
    return { success: true, data }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch rates' }
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
) {
  if (from === to) return amount

  try {
    const { data, error } = await insforge.database
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return amount

    return amount * (data as { rate: number }).rate
  } catch (_error) {
    return amount
  }
}
