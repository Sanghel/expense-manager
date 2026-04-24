import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getSavingsGoals } from '@/lib/actions/savings.actions'
import { getCategories } from '@/lib/actions/categories.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { PlanificacionPageClient } from './PlanificacionPageClient'
import type { SavingsGoal, Category } from '@/types/database.types'

type Tab = 'metas' | 'presupuestos'

export default async function PlanificacionPage({
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
  const tab = (params.tab as Tab) || 'metas'

  let initialGoals: SavingsGoal[] | null = null
  let initialBudgets: unknown[] | null = null
  let categories: Category[] = []

  if (tab === 'metas') {
    const result = await getSavingsGoals(user.id)
    initialGoals = result.success ? (result.data ?? []) : []
  } else if (tab === 'presupuestos') {
    const [categoriesResult, budgetsResult] = await Promise.all([
      getCategories(user.id),
      getBudgets(user.id),
    ])
    categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
    initialBudgets = budgetsResult.success ? (budgetsResult.data ?? []) : []
  }

  return (
    <PlanificacionPageClient
      userId={user.id}
      activeTab={tab}
      initialGoals={initialGoals}
      initialBudgets={initialBudgets}
      categories={categories}
    />
  )
}
