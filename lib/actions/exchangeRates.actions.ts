'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import type { Currency } from '@/types/database.types'

export async function getLatestRates() {
  try {
    const { data, error } = await insforgeAdmin.database
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(20)

    if (error) throw error
    return { success: true, data }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch rates' }
  }
}

export async function getAllRatePairs() {
  try {
    // Get the latest rate for each unique from/to pair
    const pairs: Array<{ from: Currency; to: Currency }> = [
      { from: 'USD', to: 'COP' },
      { from: 'COP', to: 'USD' },
      { from: 'VES', to: 'COP' },
      { from: 'COP', to: 'VES' },
      { from: 'USD', to: 'VES' },
      { from: 'VES', to: 'USD' },
    ]

    const results = await Promise.all(
      pairs.map(({ from, to }) =>
        insforgeAdmin.database
          .from('exchange_rates')
          .select('*')
          .eq('from_currency', from)
          .eq('to_currency', to)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    )

    const rates = results
      .map((r) => r.data)
      .filter(Boolean)

    return { success: true, data: rates }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch rate pairs' }
  }
}

export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) return amount

  try {
    const { data, error } = await insforgeAdmin.database
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

