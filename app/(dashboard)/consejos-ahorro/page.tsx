import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getCategoriesCached } from '@/lib/data/cached'
import { getSavingsAdvice, buildSpendingSummary } from '@/lib/actions/savingsAdvice.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getSavingsGoals } from '@/lib/actions/savings.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { ConsejosAhorroPageClient } from './ConsejosAhorroPageClient'
import type { ExistingBudget } from '@/components/savings/BudgetSuggestionsList'
import type { Category, CategoryGroupWithMembers, SavingsGoal } from '@/types/database.types'

export default async function ConsejosAhorroPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  const period = new Date().toISOString().slice(0, 7)

  const [adviceRes, summary, budgetsRes, categoriesRes, goalsRes, groupsRes] = await Promise.all([
    getSavingsAdvice(user.id, period),
    buildSpendingSummary(user.id, period),
    getBudgets(user.id),
    getCategoriesCached(user.id),
    getSavingsGoals(user.id),
    getCategoryGroups(user.id),
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
  const groups = (groupsRes.success ? groupsRes.data ?? [] : []) as CategoryGroupWithMembers[]

  return (
    <ConsejosAhorroPageClient
      userId={user.id}
      period={period}
      advice={advice}
      summary={summary}
      budgets={budgets}
      categories={categories}
      goals={goals}
      groups={groups}
    />
  )
}
