'use server'

import { endOfMonth, parseISO, startOfMonth, subMonths } from 'date-fns'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { buildConverter, type RateRow } from '@/lib/utils/currency-converter'
import { getBudgetCap } from '@/lib/utils/budget-grouping'
import { getSavingsPace } from '@/lib/utils/savings-pace'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import { getLocalDateString } from '@/lib/utils/dates'
import type {
  BudgetWithSpent,
  Currency,
  ReminderWithCategory,
  SavingsGoal,
} from '@/types/database.types'

export interface NamedAmount {
  id: string
  label: string
  icon: string | null
  value: number
}

/** Everything the Análisis section of the Resumen needs, in the preferred currency. */
export interface AnalysisDataset {
  currency: Currency
  /** `YYYY-MM` analysed and the previous one. */
  month: string
  prevMonth: string
  daysInMonth: number
  /** Last day with data: today for the month in progress, else the last day. */
  lastDay: number
  isCurrentMonth: boolean
  totals: { income: number; expense: number }
  pace: {
    /** Cumulative expense per day, index 0 = day 1, up to `lastDay`. */
    current: number[]
    /** Cumulative expense per day for the whole previous month. */
    previous: number[]
    /** Expected expense at month end at the current rhythm. */
    projection: number
    /** Previous month's cumulative expense at the same day. */
    previousAtSameDay: number
    /** Monthly budget cap, when there are budgets. */
    cap: number | null
    mostExpensiveDay: { day: number; value: number } | null
  }
  /** Last 12 months; null when no income came in that month. */
  savingsRate: { month: string; rate: number | null }[]
  /** Per-category change vs the previous month, largest moves first. */
  categoryDeltas: (NamedAmount & { previous: number; delta: number })[]
  ant: {
    threshold: number
    total: number
    count: number
    /** Share of the month's expense, 0-100. */
    share: number
    byCategory: NamedAmount[]
  }
  /** Expense matching an active reminder (fixed) vs the rest. */
  fixedVsVariable: { fixed: number; variable: number }
  /** Account balances per currency: native amount and converted value. */
  exposure: { currency: Currency; balance: number; converted: number }[]
  /** Average expense per weekday, Monday first. */
  weekday: { label: string; value: number }[]
  /** First open goal with a deadline, to make the "gastos hormiga" tip concrete. */
  goal: { name: string; requiredMonthly: number; currency: Currency } | null
}

interface Row {
  amount: number
  currency: Currency
  type: 'income' | 'expense'
  category_id: string | null
  description: string
  date: string
}

/** Purchases below this share of the month's spend count as "gastos hormiga". */
const ANT_THRESHOLD_RATIO = 0.02
const TREND_MONTHS = 12
/** Monday-first labels; JS getDay() is Sunday = 0. */
const WEEKDAYS = [
  { label: 'Lun', jsDay: 1 },
  { label: 'Mar', jsDay: 2 },
  { label: 'Mié', jsDay: 3 },
  { label: 'Jue', jsDay: 4 },
  { label: 'Vie', jsDay: 5 },
  { label: 'Sáb', jsDay: 6 },
  { label: 'Dom', jsDay: 0 },
]

function cumulative(daily: number[]): number[] {
  let running = 0
  return daily.map((v) => (running += v))
}

/**
 * Data for the Análisis cards. One 12-month transactions query covers the
 * month, the previous month and the savings-rate trend; amounts are converted
 * into the user's preferred currency.
 */
export async function getAnalysisDataset(
  userId: string,
  month: string
): Promise<{ success: boolean; data?: AnalysisDataset; error?: string }> {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  try {
    const monthStart = parseISO(`${month}-01`)
    const monthEnd = endOfMonth(monthStart)
    const prevStart = startOfMonth(subMonths(monthStart, 1))
    const trendStart = startOfMonth(subMonths(monthStart, TREND_MONTHS - 1))
    const prevMonth = getLocalDateString(prevStart).slice(0, 7)

    const [userRes, txRes, categoriesRes, accountsRes, remindersRes, goalsRes, ratePairs, budgetsResult] =
      await Promise.all([
        insforgeAdmin.database.from('users').select('preferred_currency').eq('id', userId).single(),
        insforgeAdmin.database
          .from('transactions')
          .select('amount, currency, type, category_id, description, date')
          .eq('user_id', userId)
          .gte('date', getLocalDateString(trendStart))
          .lte('date', getLocalDateString(monthEnd)),
        insforgeAdmin.database.from('categories').select('id, name, icon'),
        insforgeAdmin.database
          .from('accounts')
          .select('balance, currency, is_active')
          .eq('user_id', userId),
        insforgeAdmin.database
          .from('reminders')
          .select('description, category_id')
          .eq('user_id', userId)
          .eq('is_active', true),
        insforgeAdmin.database
          .from('savings_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .order('deadline', { ascending: true }),
        getAllRatePairs(),
        getBudgets(userId),
      ])

    if (txRes.error) throw txRes.error

    const currency = ((userRes.data?.preferred_currency as Currency) ?? 'COP') as Currency
    const convert = buildConverter((ratePairs.success ? ratePairs.data : []) as RateRow[])
    const amountOf = (t: Pick<Row, 'amount' | 'currency'>) => convert(toNumber(t.amount), t.currency, currency)

    const categories = (categoriesRes.data ?? []) as { id: string; name: string; icon: string | null }[]
    const categoryById = new Map(categories.map((c) => [c.id, c]))
    const named = (id: string, value: number): NamedAmount => {
      const c = categoryById.get(id)
      return { id: id || 'sin-categoria', label: c?.name ?? 'Sin categoría', icon: c?.icon ?? null, value }
    }

    // A transaction is "fixed" when it shares the category of an active
    // reminder and its description contains the reminder's (ignoring case and
    // accents): bank descriptions rarely match the reminder name exactly.
    const normalize = (text: string) =>
      text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const reminders = ((remindersRes.data ?? []) as Pick<ReminderWithCategory, 'description' | 'category_id'>[]).map(
      (r) => ({ text: normalize(r.description), category: r.category_id ?? '' })
    )
    const isFixed = (t: Row) => {
      const text = normalize(t.description)
      return reminders.some((r) => r.text && r.category === (t.category_id ?? '') && text.includes(r.text))
    }

    const rows = (txRes.data ?? []) as Row[]
    const current = rows.filter((t) => t.date.startsWith(month))
    const previous = rows.filter((t) => t.date.startsWith(prevMonth))

    // ── Pace ──────────────────────────────────────────────────────────────
    const daysInMonth = monthEnd.getDate()
    const prevDays = endOfMonth(prevStart).getDate()
    const isCurrentMonth = getLocalDateString().startsWith(month)
    const lastDay = isCurrentMonth ? new Date().getDate() : daysInMonth

    const dailyExpense = new Array(daysInMonth).fill(0) as number[]
    const prevDaily = new Array(prevDays).fill(0) as number[]
    const totals = { income: 0, expense: 0 }
    const byCategory = new Map<string, number>()
    let fixed = 0

    for (const t of current) {
      const value = amountOf(t)
      if (t.type === 'income') {
        totals.income += value
        continue
      }
      totals.expense += value
      dailyExpense[Number(t.date.slice(8, 10)) - 1] += value
      byCategory.set(t.category_id ?? '', (byCategory.get(t.category_id ?? '') ?? 0) + value)
      if (isFixed(t)) fixed += value
    }

    const prevByCategory = new Map<string, number>()
    for (const t of previous) {
      if (t.type !== 'expense') continue
      const value = amountOf(t)
      prevDaily[Number(t.date.slice(8, 10)) - 1] += value
      prevByCategory.set(t.category_id ?? '', (prevByCategory.get(t.category_id ?? '') ?? 0) + value)
    }

    const currentCum = cumulative(dailyExpense).slice(0, lastDay)
    const prevCum = cumulative(prevDaily)
    const spentSoFar = currentCum[currentCum.length - 1] ?? 0
    const maxDay = dailyExpense
      .slice(0, lastDay)
      .reduce<{ day: number; value: number } | null>(
        (best, value, i) => (value > 0 && (!best || value > best.value) ? { day: i + 1, value } : best),
        null
      )

    const budgets = (budgetsResult.success ? (budgetsResult.data ?? []) : []) as BudgetWithSpent[]
    const cap = getBudgetCap(budgets, currency, convert)

    // ── Savings rate, 12 months ───────────────────────────────────────────
    const trend = new Map<string, { income: number; expense: number }>()
    for (let i = 0; i < TREND_MONTHS; i++) {
      trend.set(getLocalDateString(subMonths(monthStart, TREND_MONTHS - 1 - i)).slice(0, 7), { income: 0, expense: 0 })
    }
    for (const t of rows) {
      const bucket = trend.get(t.date.slice(0, 7))
      if (bucket) bucket[t.type] += amountOf(t)
    }

    // ── Category deltas ───────────────────────────────────────────────────
    const categoryIds = new Set([...byCategory.keys(), ...prevByCategory.keys()])
    const categoryDeltas = [...categoryIds]
      .map((id) => {
        const now = byCategory.get(id) ?? 0
        const before = prevByCategory.get(id) ?? 0
        return { ...named(id, now), previous: before, delta: now - before }
      })
      .filter((c) => Math.abs(c.delta) > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6)

    // ── Ant expenses ──────────────────────────────────────────────────────
    const threshold = totals.expense * ANT_THRESHOLD_RATIO
    const antByCategory = new Map<string, number>()
    let antTotal = 0
    let antCount = 0
    for (const t of current) {
      if (t.type !== 'expense') continue
      const value = amountOf(t)
      if (value > threshold) continue
      antTotal += value
      antCount += 1
      antByCategory.set(t.category_id ?? '', (antByCategory.get(t.category_id ?? '') ?? 0) + value)
    }

    // ── Currency exposure ─────────────────────────────────────────────────
    const exposureMap = new Map<Currency, number>()
    for (const a of (accountsRes.data ?? []) as { balance: number; currency: Currency; is_active: boolean }[]) {
      if (a.is_active === false) continue
      exposureMap.set(a.currency, (exposureMap.get(a.currency) ?? 0) + toNumber(a.balance))
    }

    // ── Weekday averages (days 1..lastDay) ────────────────────────────────
    const weekdaySum = new Array(7).fill(0) as number[]
    const weekdayCount = new Array(7).fill(0) as number[]
    for (let d = 1; d <= lastDay; d++) {
      const jsDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), d).getDay()
      weekdaySum[jsDay] += dailyExpense[d - 1]
      weekdayCount[jsDay] += 1
    }

    const goalRow = ((goalsRes.data ?? []) as SavingsGoal[]).find((g) => g.deadline)
    const goalPace = goalRow ? getSavingsPace(goalRow) : null

    return {
      success: true,
      data: {
        currency,
        month,
        prevMonth,
        daysInMonth,
        lastDay,
        isCurrentMonth,
        totals,
        pace: {
          current: currentCum,
          previous: prevCum,
          projection: isCurrentMonth && lastDay > 0 ? (spentSoFar / lastDay) * daysInMonth : spentSoFar,
          previousAtSameDay: prevCum[Math.min(lastDay, prevDays) - 1] ?? 0,
          cap: cap?.limit ?? null,
          mostExpensiveDay: maxDay,
        },
        savingsRate: [...trend.entries()].map(([m, { income, expense }]) => ({
          month: m,
          // No income means no meaningful rate (0 % would read as "saved nothing").
          rate: income > 0 ? safeRatio(income - expense, income) * 100 : null,
        })),
        categoryDeltas,
        ant: {
          threshold,
          total: antTotal,
          count: antCount,
          share: totals.expense > 0 ? (antTotal / totals.expense) * 100 : 0,
          byCategory: [...antByCategory.entries()]
            .map(([id, value]) => named(id, value))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3),
        },
        fixedVsVariable: { fixed, variable: totals.expense - fixed },
        exposure: [...exposureMap.entries()]
          .map(([c, balance]) => ({ currency: c, balance, converted: convert(balance, c, currency) }))
          .sort((a, b) => b.converted - a.converted),
        weekday: WEEKDAYS.map(({ label, jsDay }) => ({
          label,
          value: weekdayCount[jsDay] > 0 ? weekdaySum[jsDay] / weekdayCount[jsDay] : 0,
        })),
        goal:
          goalRow && goalPace && goalPace.status !== 'done'
            ? { name: goalRow.name, requiredMonthly: goalPace.requiredMonthly, currency: goalRow.currency }
            : null,
      },
    }
  } catch (error) {
    console.error('Get analysis dataset error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo cargar el análisis',
    }
  }
}
