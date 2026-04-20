import { insforgeAdmin } from '@/lib/insforge-admin'
import { updateExchangeRates } from '@/lib/actions/exchangeRates.actions'
import { generateRecurringTransactions } from '@/lib/actions/recurring.actions'

export async function runDailyCatchUp(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  await Promise.all([
    catchUpExchangeRates(today),
    catchUpRecurringTransactions(userId, today),
  ])
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

async function catchUpRecurringTransactions(userId: string, today: string): Promise<void> {
  try {
    // Check if any active recurring transactions are due (never generated or last generated before today)
    const { count } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('start_date', today)
      .or(`last_generated.is.null,last_generated.lt.${today}`)

    if ((count ?? 0) > 0) {
      console.log(`[dailyCatchUp] ${count} recurring transaction(s) due — generating for user ${userId}`)
      await generateRecurringTransactions(userId)
    }
  } catch (error) {
    console.error('[dailyCatchUp] recurring transactions check failed:', error)
  }
}
