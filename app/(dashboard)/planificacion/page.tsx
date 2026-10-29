import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { getSavingsGoals } from '@/lib/actions/savings.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { PlanificacionPageClient } from './PlanificacionPageClient'
import type { MetasData, PresupuestosData } from './tabs'
import type {
  Account,
  BudgetWithSpent,
  CategoryGroupWithMembers,
  Currency,
  ExchangeRate,
} from '@/types/database.types'

export default async function PlanificacionPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  // Both tabs stream to the client as promises; `?tab=` and `?vista=` are
  // read on the client, so switching never waits for the server.
  const metas: Promise<MetasData> = Promise.all([
    getSavingsGoals(user.id),
    getAccountsCached(user.id),
    getAllRatePairs(),
  ]).then(([goalsResult, accountsResult, ratesResult]) => ({
    goals: goalsResult.success ? (goalsResult.data ?? []) : [],
    accounts: (accountsResult.success ? accountsResult.data : []) as Account[],
    exchangeRates: (ratesResult.success ? ratesResult.data : []) as ExchangeRate[],
  }))

  const presupuestos: Promise<PresupuestosData> = Promise.all([
    getCategoriesCached(user.id),
    getBudgets(user.id),
    getCategoryGroups(user.id),
  ]).then(([categoriesResult, budgetsResult, groupsResult]) => ({
    categories: categoriesResult.success ? (categoriesResult.data ?? []) : [],
    budgets: (budgetsResult.success ? (budgetsResult.data ?? []) : []) as BudgetWithSpent[],
    groups: (groupsResult.success ? (groupsResult.data ?? []) : []) as CategoryGroupWithMembers[],
  }))

  return (
    <PlanificacionPageClient
      userId={user.id}
      metas={metas}
      presupuestos={presupuestos}
      preferredCurrency={(user.preferred_currency as Currency) ?? 'COP'}
    />
  )
}
