import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { getTransactions, getTransactionsBetween } from '@/lib/actions/transactions.actions'
import { appToday, getLocalDateString, shiftDays } from '@/lib/utils/dates'
import type { OccurrenceTransaction } from '@/lib/reminders/pending'
import { getLoans } from '@/lib/actions/loans.actions'
import { getReminders } from '@/lib/actions/reminders.actions'
import { MovimientosPageClient } from './MovimientosPageClient'
import type {
  PrestamosData,
  RecordatoriosData,
  TransaccionesData,
} from './tabs'
import type {
  Account,
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
  const transacciones: Promise<TransaccionesData> = getTransactions(user.id, 500).then((txResult) => ({
    transactions: txResult.success ? ((txResult.data ?? []) as TransactionWithCategory[]) : [],
  }))

  const prestamos: Promise<PrestamosData> = getLoans(user.id).then((result) =>
    result.success && result.data ? (result.data as PrestamosData) : []
  )

  const recordatorios: Promise<RecordatoriosData> = Promise.all([
    getReminders(user.id),
    getTransactionsBetween(
      user.id,
      getLocalDateString(shiftDays(appToday(), -7)),
      getLocalDateString(shiftDays(appToday(), 31))
    ),
  ]).then(([remindersResult, txResult]) => ({
    reminders: remindersResult.success
      ? ((remindersResult.data ?? []) as ReminderWithCategory[])
      : [],
    recentTransactions: txResult.success
      ? (txResult.data as OccurrenceTransaction[])
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
