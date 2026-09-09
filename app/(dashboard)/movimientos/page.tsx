import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { getTransactions, getTransactionsByDate } from '@/lib/actions/transactions.actions'
import { getLocalDateString } from '@/lib/utils/dates'
import { getLoans } from '@/lib/actions/loans.actions'
import { getReminders } from '@/lib/actions/reminders.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { MovimientosPageClient } from './MovimientosPageClient'
import type {
  TransactionWithCategory,
  Account,
  ReminderWithCategory,
  BudgetWithSpent,
} from '@/types/database.types'

type Tab = 'transacciones' | 'prestamos' | 'recordatorios'

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('id, preferred_currency, gmail_sync_enabled')
    .eq('email', session.user.email)
    .single()

  if (!user?.id || userError) {
    redirect('/login')
  }

  const params = await searchParams
  const rawTab = params.tab
  const tab: Tab =
    rawTab === 'prestamos' || rawTab === 'recordatorios' ? rawTab : 'transacciones'

  const [categoriesResult, accountsResult] = await Promise.all([
    getCategories(user.id),
    getAccounts(user.id),
  ])
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]

  let initialTransactions: TransactionWithCategory[] | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialLoans: any[] | null = null
  let initialReminders: ReminderWithCategory[] | null = null
  let todaysTransactions: { description: string; category_id: string | null }[] = []
  let budgets: BudgetWithSpent[] = []

  if (tab === 'transacciones') {
    const [result, budgetsResult] = await Promise.all([
      getTransactions(user.id, 500),
      getBudgets(user.id),
    ])
    initialTransactions = result.success ? ((result.data ?? []) as TransactionWithCategory[]) : []
    budgets = (budgetsResult.success ? (budgetsResult.data ?? []) : []) as BudgetWithSpent[]
  } else if (tab === 'prestamos') {
    const result = await getLoans(user.id)
    initialLoans = result.success && result.data ? result.data : []
  } else if (tab === 'recordatorios') {
    const today = getLocalDateString()
    const [remindersResult, txResult] = await Promise.all([
      getReminders(user.id),
      getTransactionsByDate(user.id, today),
    ])
    initialReminders = remindersResult.success
      ? ((remindersResult.data ?? []) as ReminderWithCategory[])
      : []
    todaysTransactions = txResult.success
      ? (txResult.data as { description: string; category_id: string | null }[])
      : []
  }

  return (
    <MovimientosPageClient
      userId={user.id}
      activeTab={tab}
      categories={categories}
      accounts={accounts}
      initialTransactions={initialTransactions}
      initialLoans={initialLoans}
      initialReminders={initialReminders}
      todaysTransactions={todaysTransactions}
      budgets={budgets}
      gmailSyncEnabled={user.gmail_sync_enabled === true}
    />
  )
}
