import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getSavingsAdvice, buildSpendingSummary } from '@/lib/actions/savingsAdvice.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getCategories } from '@/lib/actions/categories.actions'
import { getSavingsGoals } from '@/lib/actions/savings.actions'
import { ConsejosAhorroPageClient } from './ConsejosAhorroPageClient'
import type { ExistingBudget } from '@/components/savings/BudgetSuggestionsList'
import type { Category, SavingsGoal } from '@/types/database.types'

export default async function ConsejosAhorroPage() {
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

  const period = new Date().toISOString().slice(0, 7)

  const [adviceRes, summary, budgetsRes, categoriesRes, goalsRes] = await Promise.all([
    getSavingsAdvice(user.id, period),
    buildSpendingSummary(user.id, period),
    getBudgets(user.id),
    getCategories(user.id),
    getSavingsGoals(user.id),
  ])

  const advice = adviceRes.success ? (adviceRes.data ?? null) : null
  const budgets = ((budgetsRes.success ? budgetsRes.data ?? [] : []) as ExistingBudget[]).map((b) => ({
    id: b.id,
    category_id: b.category_id,
    amount: b.amount,
    currency: b.currency,
    period: b.period,
    start_date: b.start_date,
  }))
  const categories = (categoriesRes.success ? categoriesRes.data ?? [] : []) as Category[]
  const goals = (goalsRes.success ? goalsRes.data ?? [] : []) as SavingsGoal[]

  return (
    <ConsejosAhorroPageClient
      userId={user.id}
      period={period}
      advice={advice}
      summary={summary}
      budgets={budgets}
      categories={categories}
      goals={goals}
    />
  )
}
