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

export async function getBudgets(userId: string) {
  if (!userId) {
    console.error('getBudgets: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { data: budgets, error: budgetError } = await insforgeAdmin.database
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (budgetError) throw budgetError

    if (!budgets || budgets.length === 0) {
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
    const groupById = new Map(groups.map((g) => [g.id, g]))
    const groupMembers = new Map(groups.map((g) => [g.id, new Set(g.category_ids)]))

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

      const inScope = (categoryId: string | null) => {
        if (scope === 'total') return true
        if (scope === 'group') {
          return categoryId ? (groupMembers.get(budget.group_id)?.has(categoryId) ?? false) : false
        }
        return categoryId === budget.category_id
      }

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
        group: budget.group_id ? (groupById.get(budget.group_id) ?? null) : null,
        spent,
        limit_amount,
        periodIncome,
        periodExpense,
        periodStart: getLocalDateString(periodStart),
        periodEnd: getLocalDateString(periodEnd),
      } as BudgetWithSpent
    })

    return { success: true, data: budgetsWithSpent }
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
