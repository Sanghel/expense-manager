'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { buildConverter, type RateRow } from '@/lib/utils/currency-converter'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import type {
  BudgetWithSpent,
  CategoryGroupWithMembers,
  Currency,
  ReminderWithCategory,
  TransactionSource,
} from '@/types/database.types'

export interface ReportFiltersInput {
  startDate: string
  endDate: string
  categoryIds: string[]
  transactionType: 'all' | 'income' | 'expense'
}

export interface NamedAmount {
  id: string
  label: string
  icon: string | null
  color: string | null
  value: number
}

export interface ReportDataset {
  currency: Currency
  totals: {
    income: number
    expense: number
    net: number
    incomeCount: number
    expenseCount: number
  }
  /** Expense share per category, descending. */
  expenseByCategory: NamedAmount[]
  incomeByCategory: NamedAmount[]
  /** Expense share per category group (empty when the user has no groups). */
  expenseByGroup: NamedAmount[]
  expenseByAccount: NamedAmount[]
  expenseBySource: NamedAmount[]
  /** 0 = Sunday. */
  expenseByWeekday: { weekday: number; label: string; value: number }[]
  /** Every month of the filtered range. */
  monthly: { month: string; income: number; expense: number }[]
  savingsRate: { month: string; rate: number }[]
  cumulative: { date: string; balance: number }[]
  /** One entry per day with expenses, for the calendar heatmap. */
  daily: { day: string; value: number }[]
  /** Expenses that match an active reminder vs. one-off ones. */
  recurringSplit: { month: string; recurring: number; oneOff: number }[]
  /** Spend below the threshold ("gastos hormiga") vs. the rest. */
  antExpenses: { threshold: number; ant: number; rest: number; count: number }
  /** Percent of each budget's limit consumed, for the polar chart. */
  budgetUsage: { id: string; label: string; percent: number }[]
  /** Expense per group, this period vs. the previous one of equal length. */
  profile: { axis: string; current: number; previous: number }[]
}

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const SOURCE_LABELS: Record<TransactionSource, string> = {
  manual: 'Manual',
  conversational: 'Chat IA',
  import: 'Importado',
  gmail: 'Gmail',
}

/** Amount below which an expense counts as a "gasto hormiga". */
const ANT_THRESHOLD_RATIO = 0.02

interface RawTransaction {
  amount: number
  currency: Currency
  type: 'income' | 'expense'
  category_id: string | null
  account_id: string | null
  description: string
  date: string
  source: TransactionSource
}

function shiftRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const span = Math.max(end.getTime() - start.getTime(), 0)
  const prevEnd = new Date(start.getTime() - 86400000)
  const prevStart = new Date(prevEnd.getTime() - span)
  return {
    prevStart: prevStart.toISOString().slice(0, 10),
    prevEnd: prevEnd.toISOString().slice(0, 10),
  }
}

function sortDesc(list: NamedAmount[]): NamedAmount[] {
  return [...list].sort((a, b) => b.value - a.value)
}

/**
 * Single source of truth for the reports page.
 *
 * Every chart used to fetch and filter its own 500 rows on the client, each
 * with a copy of the same filter block, and three of them silently dropped
 * transactions whose currency was not the most frequent one. This runs one
 * query, converts everything into the user's preferred currency, and returns
 * the series already aggregated.
 */
export async function getReportDataset(
  userId: string,
  filters: ReportFiltersInput
): Promise<{ success: boolean; data?: ReportDataset; error?: string }> {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  try {
    const { prevStart, prevEnd } = shiftRange(filters.startDate, filters.endDate)

    const [userRes, txRes, prevTxRes, categoriesRes, accountsRes, remindersRes, ratePairs, groupsResult, budgetsResult] =
      await Promise.all([
        insforgeAdmin.database.from('users').select('preferred_currency').eq('id', userId).single(),
        insforgeAdmin.database
          .from('transactions')
          .select('amount, currency, type, category_id, account_id, description, date, source')
          .eq('user_id', userId)
          .gte('date', filters.startDate)
          .lte('date', filters.endDate),
        insforgeAdmin.database
          .from('transactions')
          .select('amount, currency, type, category_id, date')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('date', prevStart)
          .lte('date', prevEnd),
        insforgeAdmin.database.from('categories').select('id, name, icon, color, type'),
        insforgeAdmin.database.from('accounts').select('id, name, icon').eq('user_id', userId),
        insforgeAdmin.database
          .from('reminders')
          .select('description, category_id')
          .eq('user_id', userId)
          .eq('is_active', true),
        getAllRatePairs(),
        getCategoryGroups(userId),
        getBudgets(userId),
      ])

    if (txRes.error) throw txRes.error

    const currency = ((userRes.data?.preferred_currency as Currency) ?? 'COP') as Currency
    const convert = buildConverter((ratePairs.success ? ratePairs.data : []) as RateRow[])

    const categories = (categoriesRes.data ?? []) as {
      id: string
      name: string
      icon: string | null
      color: string | null
    }[]
    const categoryById = new Map(categories.map((c) => [c.id, c]))

    const accounts = (accountsRes.data ?? []) as { id: string; name: string; icon: string | null }[]
    const accountById = new Map(accounts.map((a) => [a.id, a]))

    const reminderKeys = new Set(
      ((remindersRes.data ?? []) as Pick<ReminderWithCategory, 'description' | 'category_id'>[]).map(
        (r) => `${r.description}|${r.category_id ?? ''}`
      )
    )

    const groups = (groupsResult.success ? (groupsResult.data ?? []) : []) as CategoryGroupWithMembers[]
    const budgets = (budgetsResult.success ? (budgetsResult.data ?? []) : []) as BudgetWithSpent[]

    // The client-side filter block, applied once here.
    const rows = ((txRes.data ?? []) as RawTransaction[]).filter((t) => {
      if (filters.transactionType !== 'all' && t.type !== filters.transactionType) return false
      if (filters.categoryIds.length && !filters.categoryIds.includes(t.category_id ?? '')) return false
      return true
    })

    const amountOf = (t: { amount: number; currency: Currency }) =>
      convert(toNumber(t.amount), t.currency, currency)

    const totals = { income: 0, expense: 0, net: 0, incomeCount: 0, expenseCount: 0 }
    const expenseByCategory = new Map<string, number>()
    const incomeByCategory = new Map<string, number>()
    const expenseByAccount = new Map<string, number>()
    const expenseBySource = new Map<string, number>()
    const expenseByWeekday = new Array(7).fill(0) as number[]
    const monthly = new Map<string, { income: number; expense: number }>()
    const daily = new Map<string, number>()
    const recurringSplit = new Map<string, { recurring: number; oneOff: number }>()
    const expenseAmounts: number[] = []

    for (const t of rows) {
      const value = amountOf(t)
      const month = t.date.slice(0, 7)
      const bucket = monthly.get(month) ?? { income: 0, expense: 0 }

      if (t.type === 'income') {
        totals.income += value
        totals.incomeCount += 1
        bucket.income += value
        incomeByCategory.set(t.category_id ?? '', (incomeByCategory.get(t.category_id ?? '') ?? 0) + value)
      } else {
        totals.expense += value
        totals.expenseCount += 1
        bucket.expense += value
        expenseAmounts.push(value)
        expenseByCategory.set(t.category_id ?? '', (expenseByCategory.get(t.category_id ?? '') ?? 0) + value)
        expenseByAccount.set(t.account_id ?? '', (expenseByAccount.get(t.account_id ?? '') ?? 0) + value)
        expenseBySource.set(t.source, (expenseBySource.get(t.source) ?? 0) + value)
        expenseByWeekday[new Date(`${t.date}T12:00:00`).getDay()] += value
        daily.set(t.date, (daily.get(t.date) ?? 0) + value)

        const split = recurringSplit.get(month) ?? { recurring: 0, oneOff: 0 }
        if (reminderKeys.has(`${t.description}|${t.category_id ?? ''}`)) split.recurring += value
        else split.oneOff += value
        recurringSplit.set(month, split)
      }

      monthly.set(month, bucket)
    }

    totals.net = totals.income - totals.expense

    const toNamed = (map: Map<string, number>): NamedAmount[] =>
      sortDesc(
        [...map.entries()].map(([id, value]) => {
          const category = categoryById.get(id)
          return {
            id: id || 'sin-categoria',
            label: category?.name ?? 'Sin categoría',
            icon: category?.icon ?? null,
            color: category?.color ?? null,
            value,
          }
        })
      )

    // Ant expenses: everything below a small slice of the period's total spend.
    const antThreshold = totals.expense * ANT_THRESHOLD_RATIO
    const ant = expenseAmounts.filter((a) => a <= antThreshold)
    const antTotal = ant.reduce((sum, a) => sum + a, 0)

    const groupMembers = groups.map((g) => ({ group: g, members: new Set(g.category_ids) }))
    const expenseByGroup: NamedAmount[] = sortDesc(
      groupMembers.map(({ group, members }) => ({
        id: group.id,
        label: group.name,
        icon: group.icon,
        color: group.color,
        value: [...expenseByCategory.entries()]
          .filter(([categoryId]) => members.has(categoryId))
          .reduce((sum, [, value]) => sum + value, 0),
      }))
    ).filter((g) => g.value > 0)

    // Previous period, same length, for the radar comparison.
    const prevByCategory = new Map<string, number>()
    for (const t of (prevTxRes.data ?? []) as RawTransaction[]) {
      const value = amountOf(t)
      prevByCategory.set(t.category_id ?? '', (prevByCategory.get(t.category_id ?? '') ?? 0) + value)
    }

    const profileSource = groupMembers.length > 0 ? groupMembers : null
    const profile = profileSource
      ? profileSource.map(({ group, members }) => ({
          axis: group.name,
          current: [...expenseByCategory.entries()]
            .filter(([id]) => members.has(id))
            .reduce((sum, [, v]) => sum + v, 0),
          previous: [...prevByCategory.entries()]
            .filter(([id]) => members.has(id))
            .reduce((sum, [, v]) => sum + v, 0),
        }))
      : // No groups yet — fall back to the top categories so the radar is still useful.
        toNamed(expenseByCategory)
          .slice(0, 6)
          .map((c) => ({
            axis: c.label,
            current: c.value,
            previous: prevByCategory.get(c.id === 'sin-categoria' ? '' : c.id) ?? 0,
          }))

    const monthKeys = [...monthly.keys()].sort()

    return {
      success: true,
      data: {
        currency,
        totals,
        expenseByCategory: toNamed(expenseByCategory),
        incomeByCategory: toNamed(incomeByCategory),
        expenseByGroup,
        expenseByAccount: sortDesc(
          [...expenseByAccount.entries()].map(([id, value]) => {
            const account = accountById.get(id)
            return {
              id: id || 'sin-cuenta',
              label: account?.name ?? 'Sin cuenta',
              icon: account?.icon ?? null,
              color: null,
              value,
            }
          })
        ),
        expenseBySource: sortDesc(
          [...expenseBySource.entries()].map(([source, value]) => ({
            id: source,
            label: SOURCE_LABELS[source as TransactionSource] ?? source,
            icon: null,
            color: null,
            value,
          }))
        ),
        expenseByWeekday: expenseByWeekday.map((value, weekday) => ({
          weekday,
          label: WEEKDAY_LABELS[weekday],
          value,
        })),
        monthly: monthKeys.map((month) => ({
          month,
          income: monthly.get(month)!.income,
          expense: monthly.get(month)!.expense,
        })),
        savingsRate: monthKeys.map((month) => {
          const { income, expense } = monthly.get(month)!
          return { month, rate: safeRatio(income - expense, income) * 100 }
        }),
        cumulative: (() => {
          const byDate = new Map<string, number>()
          for (const t of rows) {
            const delta = t.type === 'income' ? amountOf(t) : -amountOf(t)
            byDate.set(t.date, (byDate.get(t.date) ?? 0) + delta)
          }
          let running = 0
          return [...byDate.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, delta]) => {
              running += delta
              return { date, balance: running }
            })
        })(),
        daily: [...daily.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, value]) => ({ day, value })),
        recurringSplit: monthKeys.map((month) => ({
          month,
          recurring: recurringSplit.get(month)?.recurring ?? 0,
          oneOff: recurringSplit.get(month)?.oneOff ?? 0,
        })),
        antExpenses: {
          threshold: antThreshold,
          ant: antTotal,
          rest: totals.expense - antTotal,
          count: ant.length,
        },
        budgetUsage: budgets
          .map((b) => ({
            id: b.id,
            label:
              b.scope === 'total'
                ? 'Todos los gastos'
                : b.scope === 'group'
                  ? (b.group?.name ?? 'Grupo')
                  : (b.category?.name ?? 'Sin categoría'),
            percent: Math.round(safeRatio(b.spent, b.limit_amount) * 100),
          }))
          .filter((b) => b.percent > 0)
          .slice(0, 8),
        profile,
      },
    }
  } catch (error) {
    console.error('Get report dataset error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo cargar el reporte',
    }
  }
}
