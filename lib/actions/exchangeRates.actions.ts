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
      { from: 'BOB', to: 'COP' },
      { from: 'COP', to: 'BOB' },
      { from: 'USD', to: 'BOB' },
      { from: 'BOB', to: 'USD' },
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

export async function updateRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  rate: number
) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { error } = await insforgeAdmin.database
      .from('exchange_rates')
      .insert([{
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        date: today,
      }])

    if (error) throw error
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to update rate' }
  }
}

export async function seedInitialRates() {
  try {
    // Check if rates already exist
    const { data: existing } = await insforgeAdmin.database
      .from('exchange_rates')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: true, skipped: true }
    }

    const today = new Date().toISOString().split('T')[0]

    const rates = [
      { from_currency: 'USD', to_currency: 'COP', rate: 4000, date: today },
      { from_currency: 'COP', to_currency: 'USD', rate: 0.00025, date: today },
      { from_currency: 'BOB', to_currency: 'COP', rate: 580, date: today },
      { from_currency: 'COP', to_currency: 'BOB', rate: 0.001724, date: today },
      { from_currency: 'USD', to_currency: 'BOB', rate: 6.9, date: today },
      { from_currency: 'BOB', to_currency: 'USD', rate: 0.14493, date: today },
    ]

    const { error } = await insforgeAdmin.database
      .from('exchange_rates')
      .insert(rates)

    if (error) throw error
    return { success: true, skipped: false }
  } catch (_error) {
    return { success: false, error: 'Failed to seed rates' }
  }
}
