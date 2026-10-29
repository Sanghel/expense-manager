import type {
  Account,
  BudgetWithSpent,
  Category,
  CategoryGroupWithMembers,
  ExchangeRate,
  SavingsGoal,
} from '@/types/database.types'

export type PlanificacionTab = 'metas' | 'presupuestos'

export function parsePlanificacionTab(raw: string | null | undefined): PlanificacionTab {
  return raw === 'presupuestos' ? 'presupuestos' : 'metas'
}

export interface MetasData {
  goals: SavingsGoal[]
  accounts: Account[]
  exchangeRates: ExchangeRate[]
}

export interface PresupuestosData {
  budgets: BudgetWithSpent[]
  categories: Category[]
  groups: CategoryGroupWithMembers[]
}
