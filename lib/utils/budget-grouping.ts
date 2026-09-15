import { safeRatio, toNumber } from './numbers'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '@/types/database.types'

export interface GroupBreakdownMember {
  budget: BudgetWithSpent
  /** Proporción consumida (0-1+). 0 cuando el límite es 0. */
  ratio: number
}

export interface GroupBreakdown {
  /** El presupuesto de grupo. */
  group: BudgetWithSpent
  /**
   * Categorías miembro CON presupuesto propio y en la misma moneda que el
   * grupo, ordenadas por consumo desc.
   */
  members: GroupBreakdownMember[]
  /**
   * Gasto del grupo que no cubre ninguna categoría con presupuesto propio.
   * Normalizado a 0: un presupuesto de categoría con periodo distinto al del
   * grupo compara ventanas de tiempo diferentes y puede dar negativo.
   */
  residual: number
}

export function splitBudgetsByScope(budgets: BudgetWithSpent[]): {
  total: BudgetWithSpent[]
  groups: BudgetWithSpent[]
  categories: BudgetWithSpent[]
} {
  return {
    total: budgets.filter((b) => b.scope === 'total'),
    groups: budgets.filter((b) => b.scope === 'group'),
    categories: budgets.filter((b) => b.scope === 'category'),
  }
}

/** Orden descendente por proporción consumida. No muta la entrada. */
export function sortByConsumption(budgets: BudgetWithSpent[]): BudgetWithSpent[] {
  return [...budgets].sort(
    (a, b) => safeRatio(b.spent, b.limit_amount) - safeRatio(a.spent, a.limit_amount)
  )
}

export function buildGroupBreakdown(
  groupBudget: BudgetWithSpent,
  categoryBudgets: BudgetWithSpent[],
  groups: CategoryGroupWithMembers[]
): GroupBreakdown {
  const memberIds = new Set(
    groups.find((g) => g.id === groupBudget.group_id)?.category_ids ?? []
  )
  // `spent` viene en la moneda de cada presupuesto: restar o listar miembros de
  // otra moneda produciría un residual sin sentido, formateado con la moneda
  // del grupo. Solo entran los que comparten moneda con el grupo.
  const members = categoryBudgets.filter(
    (b) =>
      b.category_id !== null &&
      memberIds.has(b.category_id) &&
      b.currency === groupBudget.currency
  )
  const membersSpent = members.reduce((acc, b) => acc + toNumber(b.spent), 0)
  const residual = toNumber(groupBudget.spent) - membersSpent

  return {
    group: groupBudget,
    members: sortByConsumption(members).map((b) => ({
      budget: b,
      ratio: safeRatio(b.spent, b.limit_amount),
    })),
    residual: residual > 0 ? residual : 0,
  }
}
