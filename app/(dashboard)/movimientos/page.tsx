import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getRecurringTransactions } from '@/lib/actions/recurring.actions'
import { getLoans } from '@/lib/actions/loans.actions'
import { MovimientosPageClient } from './MovimientosPageClient'
import type { TransactionWithCategory, Account } from '@/types/database.types'

type Tab = 'transacciones' | 'recurrentes' | 'prestamos'

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
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user?.id || userError) {
    redirect('/login')
  }

  const params = await searchParams
  const tab = (params.tab as Tab) || 'transacciones'

  const [categoriesResult, accountsResult] = await Promise.all([
    getCategories(user.id),
    getAccounts(user.id),
  ])
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]

  let initialTransactions: TransactionWithCategory[] | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialRecurring: any[] | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialLoans: any[] | null = null

  if (tab === 'transacciones') {
    const result = await getTransactions(user.id, 500)
    initialTransactions = result.success ? ((result.data ?? []) as TransactionWithCategory[]) : []
  } else if (tab === 'recurrentes') {
    const result = await getRecurringTransactions(user.id)
    initialRecurring = result.success ? (result.data ?? []) : []
  } else if (tab === 'prestamos') {
    const result = await getLoans(user.id)
    initialLoans = result.success && result.data ? result.data : []
  }

  return (
    <MovimientosPageClient
      userId={user.id}
      activeTab={tab}
      categories={categories}
      accounts={accounts}
      initialTransactions={initialTransactions}
      initialRecurring={initialRecurring}
      initialLoans={initialLoans}
    />
  )
}
