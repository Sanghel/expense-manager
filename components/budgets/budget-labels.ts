import { formatCompactCurrency } from '@/lib/utils/currency'
import { toNumber } from '@/lib/utils/numbers'
import type { BudgetWithSpent } from '@/types/database.types'

/** Percent base of the cap, or null for fixed-amount budgets. */
export function percentBase(budget: BudgetWithSpent): string | null {
  if (budget.amount_type === 'percent_income') return `${toNumber(budget.percent)}% de ingresos`
  if (budget.amount_type === 'percent_expense') return `${toNumber(budget.percent)}% del gasto`
  return null
}

/** A percentage budget resolves to 0 in a period with no income/expense. */
export function hasNoBasis(budget: BudgetWithSpent): boolean {
  return budget.amount_type !== 'fixed' && toNumber(budget.limit_amount) <= 0
}

/** "Quedan COP 410.080" / "Excedido COP 254.526". */
export function remainingLabel(budget: BudgetWithSpent): { text: string; exceeded: boolean } {
  const left = toNumber(budget.limit_amount) - toNumber(budget.spent)
  return {
    text: `${left < 0 ? 'Excedido' : 'Quedan'} ${formatCompactCurrency(Math.abs(left), budget.currency)}`,
    exceeded: left < 0,
  }
}

/** "Mensual · desde 2026-10-01 · 20% de ingresos" */
export function budgetMeta(budget: BudgetWithSpent): string {
  return [
    budget.period === 'monthly' ? 'Mensual' : 'Anual',
    `desde ${budget.start_date}`,
    percentBase(budget),
  ]
    .filter(Boolean)
    .join(' · ')
}
