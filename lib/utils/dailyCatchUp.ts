import { insforgeAdmin } from '@/lib/insforge-admin'
import { updateExchangeRates } from '@/lib/actions/exchangeRates.actions'

export async function runDailyCatchUp(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  await catchUpExchangeRates(today)
}

async function catchUpExchangeRates(today: string): Promise<void> {
  try {
    const { count } = await insforgeAdmin.database
      .from('exchange_rates')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    if ((count ?? 0) === 0) {
      console.log('[dailyCatchUp] exchange_rates missing for today — updating')
      await updateExchangeRates()
    }
  } catch (error) {
    console.error('[dailyCatchUp] exchange rates check failed:', error)
  }
}
