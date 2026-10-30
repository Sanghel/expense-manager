'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { buildConverter, type RateRow } from '@/lib/utils/currency-converter'
import { resolvePeriod } from '@/lib/utils/budget-period'
import { toNumber } from '@/lib/utils/numbers'
import { getLocalDateString } from '@/lib/utils/dates'
import {
  createBudgetSchema,
  type CreateBudgetInput,
} from '@/lib/validations/budget'
import type {
  BudgetAmountType,
  BudgetScope,
  BudgetWithSpent,
  CategoryGroupWithMembers,
  Currency,
} from '@/types/database.types'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

function revalidateBudgets() {
  revalidatePath('/budgets')
  revalidatePath('/planificacion')
  revalidatePath('/dashboard')
  revalidatePath('/consejos-ahorro')
}

/**
 * One budget per category group, built from the monthly budgets of its
 * member categories: the limit and the spent are their sums (converted into
 * the currency most of them use). Spend in member categories without a
 * budget is reported apart as `otherSpent`, so it doesn't inflate the %.
 */
function deriveGroupBudgets(
  budgets: BudgetWithSpent[],
  groups: CategoryGroupWithMembers[],
  transactions: { category_id: string | null; amount: number; currency: string; date: string; type: string }[],
  convert: (amount: number, from: Currency, to: Currency) => number
): BudgetWithSpent[] {
  const monthlyByCategory = new Map(
    budgets
      .filter((b) => b.scope === 'category' && b.period === 'monthly' && b.category_id)
      .map((b) => [b.category_id as string, b])
  )

  return groups.flatMap((group) => {
    const members = group.category_ids
      .map((id) => monthlyByCategory.get(id))
      .filter((b): b is BudgetWithSpent => !!b)
    if (members.length === 0) return []

    const counts = new Map<Currency, number>()
    for (const m of members) counts.set(m.currency, (counts.get(m.currency) ?? 0) + 1)
    const currency = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]

    const limit = members.reduce((s, m) => s + convert(toNumber(m.limit_amount), m.currency, currency), 0)
    const spent = members.reduce((s, m) => s + convert(toNumber(m.spent), m.currency, currency), 0)

    // Same cycle as the members (all monthly): first member's window.
    const { periodStart, periodEnd } = members[0]
    const budgeted = new Set(members.map((m) => m.category_id))
    const unbudgeted = new Set(group.category_ids.filter((id) => !budgeted.has(id)))
    const otherSpent = transactions
      .filter((t) => {
        const date = String(t.date).slice(0, 10)
        return (
          t.type === 'expense' &&
          t.category_id !== null &&
          unbudgeted.has(t.category_id) &&
          date >= String(periodStart) &&
          date <= String(periodEnd)
        )
      })
      .reduce((s, t) => s + convert(toNumber(t.amount), t.currency as Currency, currency), 0)

    return [
      {
        ...members[0],
        id: `group-${group.id}`,
        scope: 'group',
        category_id: null,
        category: null,
        group_id: group.id,
        group,
        amount_type: 'fixed',
        amount: limit,
        percent: null,
        currency,
        limit_amount: limit,
        spent,
        derived: true,
        otherSpent,
      } as BudgetWithSpent,
    ]
  })
}

export async function getBudgets(userId: string) {
  if (!userId) {
    console.error('getBudgets: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { data: rows, error: budgetError } = await insforgeAdmin.database
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (budgetError) throw budgetError

    // Stored group budgets are legacy: a group's budget is derived from its
    // categories below (#574), so those rows are ignored.
    const budgets = (rows ?? []).filter((b) => b.scope !== 'group')

    if (budgets.length === 0) {
      return { success: true, data: [] as BudgetWithSpent[] }
    }

    const now = new Date()
    const periods = budgets.map((budget) => resolvePeriod(budget.start_date, budget.period, now))

    // Bounded to the window the budgets actually cover — this used to fetch
    // every expense transaction the user had ever recorded.
    const windowStart = getLocalDateString(
      new Date(Math.min(...periods.map((p) => p.periodStart.getTime())))
    )
    const windowEnd = getLocalDateString(
      new Date(Math.max(...periods.map((p) => p.periodEnd.getTime())))
    )

    // Income rows are needed too: a percent_income budget derives its limit
    // from the period's income, so the query can no longer filter by type.
    const [{ data: transactions, error: transError }, ratePairs, groupsResult] = await Promise.all([
      insforgeAdmin.database
        .from('transactions')
        .select('category_id, amount, currency, date, type')
        .eq('user_id', userId)
        .gte('date', windowStart)
        .lte('date', windowEnd),
      getAllRatePairs(),
      getCategoryGroups(userId),
    ])

    if (transError) throw transError

    const convert = buildConverter((ratePairs.success ? ratePairs.data : []) as RateRow[])
    const groups = (groupsResult.success ? (groupsResult.data ?? []) : []) as CategoryGroupWithMembers[]

    const budgetsWithSpent = budgets.map((budget, index) => {
      const { periodStart, periodEnd } = periods[index]
      // Compared as YYYY-MM-DD strings, not Date objects: `new Date('2026-09-01')`
      // parses as UTC midnight, which is Aug 31 19:00 in COP (UTC-5) and falls
      // before a local-midnight periodStart, so the first day of every cycle was
      // silently dropped from `spent`.
      const periodStartKey = getLocalDateString(periodStart)
      const periodEndKey = getLocalDateString(periodEnd)
      const currency = budget.currency as Currency
      const scope = (budget.scope ?? 'category') as BudgetScope
      const amountType = (budget.amount_type ?? 'fixed') as BudgetAmountType

      const inScope = (categoryId: string | null) =>
        scope === 'total' || categoryId === budget.category_id

      let spent = 0
      let periodIncome = 0
      let periodExpense = 0

      for (const t of transactions ?? []) {
        const transDate = String(t.date).slice(0, 10)
        if (transDate < periodStartKey || transDate > periodEndKey) continue

        // Converted into the budget's currency: a USD purchase used to be
        // summed 1:1 into a COP budget.
        const value = convert(toNumber(t.amount), t.currency as Currency, currency)

        if (t.type === 'income') {
          periodIncome += value
          continue
        }

        periodExpense += value
        if (inScope(t.category_id)) spent += value
      }

      const limit_amount =
        amountType === 'fixed'
          ? toNumber(budget.amount)
          : (toNumber(budget.percent) / 100) *
            (amountType === 'percent_income' ? periodIncome : periodExpense)

      return {
        ...budget,
        scope,
        amount_type: amountType,
        amount: budget.amount === null ? null : toNumber(budget.amount),
        percent: budget.percent === null ? null : toNumber(budget.percent),
        group: null,
        spent,
        limit_amount,
        periodIncome,
        periodExpense,
        periodStart: getLocalDateString(periodStart),
        periodEnd: getLocalDateString(periodEnd),
      } as BudgetWithSpent
    })

    return {
      success: true,
      data: [
        ...budgetsWithSpent,
        ...deriveGroupBudgets(budgetsWithSpent, groups, transactions ?? [], convert),
      ],
    }
  } catch (error) {
    console.error('Get budgets error:', error)
    return { success: false, error: errorMessage(error, 'No se pudieron cargar los presupuestos') }
  }
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  if (!userId) {
    console.error('createBudget: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const validated = createBudgetSchema.parse(data)

    const { data: budget, error } = await insforgeAdmin.database
      .from('budgets')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error

    revalidateBudgets()
    return { success: true, data: budget }
  } catch (error) {
    console.error('Create budget error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo crear el presupuesto') }
  }
}

export async function updateBudget(
  id: string,
  userId: string,
  data: CreateBudgetInput
) {
  if (!userId) {
    console.error('updateBudget: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    // Not `.partial()`: a schema with `superRefine` can't be partialised, and
    // the form always submits the complete object on edit anyway.
    const validated = createBudgetSchema.parse(data)

    const { data: budget, error } = await insforgeAdmin.database
      .from('budgets')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidateBudgets()
    return { success: true, data: budget }
  } catch (error) {
    console.error('Update budget error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo actualizar el presupuesto') }
  }
}

export async function deleteBudget(id: string, userId: string) {
  if (!userId) {
    console.error('deleteBudget: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { error } = await insforgeAdmin.database
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidateBudgets()
    return { success: true }
  } catch (error) {
    console.error('Delete budget error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo eliminar el presupuesto') }
  }
}

export interface BudgetContext {
  /** 'YYYY-MM' of the month the figures come from (the previous one). */
  month: string
  income: number
  expense: number
  /** Expense per category id. */
  expenseByCategory: Record<string, number>
}

/**
 * Last month's income, expense and expense per category, in `currency`: the
 * budget form uses them for "En septiembre gastaste…" and the % equivalences.
 */
export async function getBudgetContext(userId: string, currency: Currency) {
  if (!userId) {
    console.error('getBudgetContext: userId is missing')
    return { success: false as const, error: 'Falta el identificador de usuario' }
  }
  try {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0)

    const [{ data: transactions, error }, ratePairs] = await Promise.all([
      insforgeAdmin.database
        .from('transactions')
        .select('category_id, amount, currency, type')
        .eq('user_id', userId)
        .gte('date', getLocalDateString(from))
        .lte('date', getLocalDateString(to)),
      getAllRatePairs(),
    ])
    if (error) throw error

    const convert = buildConverter((ratePairs.success ? ratePairs.data : []) as RateRow[])
    const context: BudgetContext = {
      month: getLocalDateString(from).slice(0, 7),
      income: 0,
      expense: 0,
      expenseByCategory: {},
    }
    for (const t of transactions ?? []) {
      const value = convert(toNumber(t.amount), t.currency as Currency, currency)
      if (t.type === 'income') {
        context.income += value
        continue
      }
      context.expense += value
      if (t.category_id) {
        context.expenseByCategory[t.category_id] = (context.expenseByCategory[t.category_id] ?? 0) + value
      }
    }
    return { success: true as const, data: context }
  } catch (error) {
    console.error('Get budget context error:', error)
    return { success: false as const, error: errorMessage(error, 'No se pudo cargar el historial') }
  }
}
