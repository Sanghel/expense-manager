import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getSavingsGoals } from '@/lib/actions/savings.actions'
import { getCategories } from '@/lib/actions/categories.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { PlanificacionPageClient } from './PlanificacionPageClient'
import type {
  SavingsGoal,
  Category,
  CategoryGroupWithMembers,
  Account,
  Currency,
  ExchangeRate,
  BudgetWithSpent,
} from '@/types/database.types'

type Tab = 'metas' | 'presupuestos'
type Vista = 'grupos' | 'categorias'

export default async function PlanificacionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; vista?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('id, preferred_currency')
    .eq('email', session.user.email)
    .single()

  if (!user?.id || userError) {
    redirect('/login')
  }

  const params = await searchParams
  const tab = (params.tab as Tab) || 'metas'
  const vista: Vista = params.vista === 'categorias' ? 'categorias' : 'grupos'

  let initialGoals: SavingsGoal[] | null = null
  let initialBudgets: BudgetWithSpent[] | null = null
  let categories: Category[] = []
  let accounts: Account[] = []
  let exchangeRates: ExchangeRate[] = []
  let categoryGroups: CategoryGroupWithMembers[] = []

  if (tab === 'metas') {
    const [goalsResult, accountsResult, ratesResult] = await Promise.all([
      getSavingsGoals(user.id),
      getAccounts(user.id),
      getAllRatePairs(),
    ])
    initialGoals = goalsResult.success ? (goalsResult.data ?? []) : []
    accounts = (accountsResult.success ? accountsResult.data : []) as Account[]
    exchangeRates = (ratesResult.success ? ratesResult.data : []) as ExchangeRate[]
  } else if (tab === 'presupuestos') {
    const [categoriesResult, budgetsResult, groupsResult] = await Promise.all([
      getCategories(user.id),
      getBudgets(user.id),
      getCategoryGroups(user.id),
    ])
    categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
    initialBudgets = budgetsResult.success ? ((budgetsResult.data ?? []) as BudgetWithSpent[]) : []
    categoryGroups = groupsResult.success ? ((groupsResult.data ?? []) as CategoryGroupWithMembers[]) : []
  }

  return (
    <PlanificacionPageClient
      userId={user.id}
      activeTab={tab}
      vista={vista}
      initialGoals={initialGoals}
      initialBudgets={initialBudgets}
      categories={categories}
      categoryGroups={categoryGroups}
      accounts={accounts}
      preferredCurrency={(user.preferred_currency as Currency) ?? 'COP'}
      exchangeRates={exchangeRates}
    />
  )
}
