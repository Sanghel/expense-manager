import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)

    if (!res.ok) {
      throw new Error(`exchangerate-api responded with ${res.status}`)
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

    const { error } = await insforgeAdmin.database
      .from('exchange_rates')
      .insert(rates)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      rates: { usdCop, usdVes, vesCop: usdCop / usdVes },
    })
  } catch (error) {
    console.error('Cron update-exchange-rates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
