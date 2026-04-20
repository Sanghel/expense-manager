'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import type { Currency } from '@/types/database.types'

export async function updateExchangeRates() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) {
    return { success: false, error: 'EXCHANGE_RATE_API_KEY no configurada' }
  }

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)
    if (!res.ok) {
      const body = await res.text()
      console.error(`[updateExchangeRates] API error status=${res.status} body=${body}`)
      return { success: false, error: `exchangerate-api respondió con ${res.status}` }
    }

    const json = await res.json()
    const usdCop: number = json.conversion_rates.COP
    const usdVes: number = json.conversion_rates.VES
    const today = new Date().toISOString().split('T')[0]

    const rates = [
      { from_currency: 'USD', to_currency: 'COP', rate: usdCop, date: today },
      { from_currency: 'COP', to_currency: 'USD', rate: 1 / usdCop, date: today },
      { from_currency: 'USD', to_currency: 'VES', rate: usdVes, date: today },
      { from_currency: 'VES', to_currency: 'USD', rate: 1 / usdVes, date: today },
      { from_currency: 'VES', to_currency: 'COP', rate: usdCop / usdVes, date: today },
      { from_currency: 'COP', to_currency: 'VES', rate: usdVes / usdCop, date: today },
    ]

    const { error: deleteError } = await insforgeAdmin.database
      .from('exchange_rates')
      .delete()
      .eq('date', today)

    if (deleteError) {
      console.error('[updateExchangeRates] delete error:', JSON.stringify(deleteError))
      return { success: false, error: 'Error al limpiar tasas del día' }
    }

    const { error: insertError } = await insforgeAdmin.database
      .from('exchange_rates')
      .insert(rates)

    if (insertError) {
      console.error('[updateExchangeRates] insert error:', JSON.stringify(insertError))
      return { success: false, error: 'Error al guardar tasas' }
    }

    console.log(`[updateExchangeRates] done date=${today} usdCop=${usdCop} usdVes=${usdVes}`)
    return { success: true, data: { usdCop, usdVes, vesCop: usdCop / usdVes, date: today } }
  } catch (error) {
    console.error('[updateExchangeRates] unhandled error:', error)
    return { success: false, error: 'Error interno al actualizar tasas' }
  }
}

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

