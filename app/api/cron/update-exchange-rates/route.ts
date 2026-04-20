import { NextRequest, NextResponse } from 'next/server'
import { updateExchangeRates } from '@/lib/actions/exchangeRates.actions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  console.log(`[cron:update-exchange-rates] start=${new Date().toISOString()}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:update-exchange-rates] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await updateExchangeRates()

  if (!result.success) {
    console.error(`[cron:update-exchange-rates] failed error=${result.error}`)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  const d = result.data as { usdCop: number; usdVes: number; vesCop: number; date: string }
  console.log(`[cron:update-exchange-rates] success date=${d.date} usdCop=${d.usdCop} usdVes=${d.usdVes} vesCop=${d.vesCop}`)
  return NextResponse.json({ ok: true, ...result.data })
}
