'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { buildConverter, type RateRow } from '@/lib/utils/currency-converter'
import { resolvePeriod } from '@/lib/utils/budget-period'
import { toNumber } from '@/lib/utils/numbers'
import { getLocalDateString } from '@/lib/utils/dates'
import {
  createBudgetSchema,
  type CreateBudgetInput,
} from '@/lib/validations/budget'
import type { BudgetWithSpent, Currency } from '@/types/database.types'

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

    const [{ data: transactions, error: transError }, ratePairs] = await Promise.all([
      insforgeAdmin.database
        .from('transactions')
        .select('category_id, amount, currency, date, type')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', windowStart)
        .lte('date', windowEnd),
      getAllRatePairs(),
    ])

    if (transError) throw transError

    const convert = buildConverter((ratePairs.success ? ratePairs.data : []) as RateRow[])

    const budgetsWithSpent = budgets.map((budget, index) => {
      const { periodStart, periodEnd } = periods[index]

      const spent = (transactions || [])
        .filter((t) => {
          if (t.category_id !== budget.category_id) return false
          const transDate = new Date(t.date)
          return transDate >= periodStart && transDate <= periodEnd
        })
        // Converted into the budget's currency: a USD purchase used to be
        // summed 1:1 into a COP budget.
        .reduce(
          (sum, t) =>
            sum + convert(toNumber(t.amount), t.currency as Currency, budget.currency as Currency),
          0
        )

      return {
        ...budget,
        amount: toNumber(budget.amount),
        spent,
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
  data: Partial<CreateBudgetInput>
) {
  if (!userId) {
    console.error('updateBudget: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const validated = createBudgetSchema.partial().parse(data)

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
