import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { getTransactions, getTransactionsByDate } from '@/lib/actions/transactions.actions'
import { getLocalDateString } from '@/lib/utils/dates'
import { getLoans } from '@/lib/actions/loans.actions'
import { getReminders } from '@/lib/actions/reminders.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { MovimientosPageClient } from './MovimientosPageClient'
import type {
  PrestamosData,
  RecordatoriosData,
  TransaccionesData,
} from './tabs'
import type {
  Account,
  BudgetWithSpent,
  ReminderWithCategory,
  TransactionWithCategory,
} from '@/types/database.types'

export default async function MovimientosPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  // Every tab starts loading now and streams to the client as a promise, so
  // switching tabs never waits for the server. The `?tab=` param is read on
  // the client.
  const transacciones: Promise<TransaccionesData> = Promise.all([
    getTransactions(user.id, 500),
    getBudgets(user.id),
  ]).then(([txResult, budgetsResult]) => ({
    transactions: txResult.success ? ((txResult.data ?? []) as TransactionWithCategory[]) : [],
    budgets: (budgetsResult.success ? (budgetsResult.data ?? []) : []) as BudgetWithSpent[],
  }))

  const prestamos: Promise<PrestamosData> = getLoans(user.id).then((result) =>
    result.success && result.data ? (result.data as PrestamosData) : []
  )

  const recordatorios: Promise<RecordatoriosData> = Promise.all([
    getReminders(user.id),
    getTransactionsByDate(user.id, getLocalDateString()),
  ]).then(([remindersResult, txResult]) => ({
    reminders: remindersResult.success
      ? ((remindersResult.data ?? []) as ReminderWithCategory[])
      : [],
    todaysTransactions: txResult.success
      ? (txResult.data as { description: string; category_id: string | null }[])
      : [],
  }))

  const [categoriesResult, accountsResult] = await Promise.all([
    getCategoriesCached(user.id),
    getAccountsCached(user.id),
  ])
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]

  return (
    <MovimientosPageClient
      userId={user.id}
      categories={categories}
      accounts={accounts}
      transacciones={transacciones}
      prestamos={prestamos}
      recordatorios={recordatorios}
      gmailSyncEnabled={user.gmail_sync_enabled === true}
    />
  )
}
