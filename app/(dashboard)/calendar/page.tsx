import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { CalendarPageContent } from '@/components/calendar/CalendarPageContent'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getReminders } from '@/lib/actions/reminders.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import type { TransactionWithCategory, Account, Currency, ExchangeRate, ReminderWithCategory } from '@/types/database.types'

export default async function CalendarPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  const [transactionsResult, categoriesResult, accountsResult, remindersResult, ratesResult] = await Promise.all([
    getTransactions(user.id, 1000),
    getCategoriesCached(user.id),
    getAccountsCached(user.id),
    getReminders(user.id),
    getAllRatePairs(),
  ])

  const transactions: TransactionWithCategory[] = transactionsResult.success ? (transactionsResult.data ?? []) : []
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]
  const reminders = (remindersResult.success ? remindersResult.data : []) as ReminderWithCategory[]
  const exchangeRates = (ratesResult.success ? ratesResult.data : []) as ExchangeRate[]

  return (
    <CalendarPageContent
      userId={user.id}
      initialTransactions={transactions}
      categories={categories}
      accounts={accounts}
      reminders={reminders}
      preferredCurrency={(user.preferred_currency as Currency) ?? 'COP'}
      exchangeRates={exchangeRates}
    />
  )
}
