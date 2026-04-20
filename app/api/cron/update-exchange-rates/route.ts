import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'

export async function GET(req: NextRequest) {
  const start = new Date().toISOString()
  console.log(`[cron:update-exchange-rates] start=${start}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:update-exchange-rates] Unauthorized — invalid or missing CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) {
    console.error('[cron:update-exchange-rates] EXCHANGE_RATE_API_KEY is not configured')
    return NextResponse.json({ error: 'Missing EXCHANGE_RATE_API_KEY' }, { status: 500 })
  }

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)

    if (!res.ok) {
      const body = await res.text()
      console.error(`[cron:update-exchange-rates] exchangerate-api error status=${res.status} body=${body}`)
      throw new Error(`exchangerate-api responded with ${res.status}`)
    }

    const json = await res.json()
    const usdCop: number = json.conversion_rates.COP
    const usdVes: number = json.conversion_rates.VES
    console.log(`[cron:update-exchange-rates] fetched rates usdCop=${usdCop} usdVes=${usdVes}`)

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
      .upsert(rates, { onConflict: 'from_currency,to_currency,date' })

    if (error) {
      console.error('[cron:update-exchange-rates] DB upsert error:', JSON.stringify(error))
      throw error
    }

    console.log(`[cron:update-exchange-rates] done upserted=${rates.length} rows date=${today}`)
    return NextResponse.json({
      ok: true,
      rates: { usdCop, usdVes, vesCop: usdCop / usdVes },
    })
  } catch (error) {
    console.error('[cron:update-exchange-rates] unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
