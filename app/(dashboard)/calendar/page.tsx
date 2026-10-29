import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { CalendarPageContent } from '@/components/calendar/CalendarPageContent'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getReminders } from '@/lib/actions/reminders.actions'
import type { TransactionWithCategory, Account, ReminderWithCategory } from '@/types/database.types'

export default async function CalendarPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  const [transactionsResult, categoriesResult, accountsResult, remindersResult] = await Promise.all([
    getTransactions(user.id, 1000),
    getCategoriesCached(user.id),
    getAccountsCached(user.id),
    getReminders(user.id),
  ])

  const transactions: TransactionWithCategory[] = transactionsResult.success ? (transactionsResult.data ?? []) : []
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]
  const reminders = (remindersResult.success ? remindersResult.data : []) as ReminderWithCategory[]

  return (
    <CalendarPageContent
      userId={user.id}
      initialTransactions={transactions}
      categories={categories}
      accounts={accounts}
      reminders={reminders}
    />
  )
}
