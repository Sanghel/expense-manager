'use server'

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { savingsAdvicePayloadSchema } from '@/lib/validations/savingsAdvice'
import type {
  AiSavingsAdvice,
  Currency,
  SavingsInsight,
  SavingsBudgetSuggestion,
} from '@/types/database.types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Current period as 'YYYY-MM' (server local time). */
function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7)
}

/** The period N months before the given 'YYYY-MM'. */
function shiftPeriod(period: string, months: number): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + months, 1))
  return d.toISOString().slice(0, 7)
}

type RateRow = { from_currency: Currency; to_currency: Currency; rate: number }

/** Builds an in-memory converter from the latest stored rate pairs. */
function buildConverter(rates: RateRow[]) {
  const map = new Map<string, number>()
  for (const r of rates) {
    if (r && r.from_currency && r.to_currency) {
      map.set(`${r.from_currency}_${r.to_currency}`, r.rate)
    }
  }
  return (amount: number, from: Currency, to: Currency): number => {
    if (from === to) return amount
    const rate = map.get(`${from}_${to}`)
    // No rate available → fall back to the raw amount (same behaviour as
    // convertCurrency in exchangeRates.actions).
    return rate ? amount * rate : amount
  }
}

// ---------------------------------------------------------------------------
// Aggregation — compact spending summary fed to the model (no raw rows)
// ---------------------------------------------------------------------------

export interface SpendingSummary {
  period: string
  currency: Currency
  hasData: boolean
  transactionCount: number
  totals: { income: number; expense: number; net: number }
  categories: { category_id: string; name: string; current: number; previous: number; delta_pct: number | null }[]
  budgets: { category_id: string; name: string; budget_amount: number; spent: number; utilization_pct: number }[]
  goals: { name: string; target: number; current: number; progress_pct: number; deadline: string | null }[]
}

export async function buildSpendingSummary(
  userId: string,
  period: string = currentPeriod()
): Promise<SpendingSummary> {
  const prevPeriod = shiftPeriod(period, -1)
  const since = `${prevPeriod}-01`

  // Resolve preferred currency
  const { data: user } = await insforgeAdmin.database
    .from('users')
    .select('preferred_currency')
    .eq('id', userId)
    .single()
  const currency = (user?.preferred_currency ?? 'COP') as Currency

  // Load the data we need in parallel
  const [txRes, catRes, budgetRes, goalRes, ratePairs] = await Promise.all([
    insforgeAdmin.database
      .from('transactions')
      .select('amount, currency, type, category_id, date')
      .eq('user_id', userId)
      .gte('date', since),
    insforgeAdmin.database.from('categories').select('id, name'),
    insforgeAdmin.database
      .from('budgets')
      .select('category_id, amount, currency')
      .eq('user_id', userId),
    insforgeAdmin.database
      .from('savings_goals')
      .select('name, target_amount, current_amount, currency, deadline, is_completed')
      .eq('user_id', userId),
    getAllRatePairs(),
  ])

  const convert = buildConverter((ratePairs.success ? ratePairs.data : []) as RateRow[])
  const transactions = (txRes.data ?? []) as {
    amount: number
    currency: Currency
    type: 'income' | 'expense'
    category_id: string | null
    date: string
  }[]
  const categoryName = new Map<string, string>(
    ((catRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  )

  const inPeriod = (date: string, p: string) => typeof date === 'string' && date.startsWith(p)

  // Totals for the target period
  let income = 0
  let expense = 0
  let transactionCount = 0
  // Per-category expense, current vs previous period
  const current = new Map<string, number>()
  const previous = new Map<string, number>()

  for (const t of transactions) {
    const amount = convert(t.amount || 0, t.currency, currency)
    if (inPeriod(t.date, period)) {
      transactionCount++
      if (t.type === 'income') income += amount
      else {
        expense += amount
        const key = t.category_id ?? 'sin-categoria'
        current.set(key, (current.get(key) ?? 0) + amount)
      }
    } else if (inPeriod(t.date, prevPeriod) && t.type === 'expense') {
      const key = t.category_id ?? 'sin-categoria'
      previous.set(key, (previous.get(key) ?? 0) + amount)
    }
  }

  const categoryKeys = new Set<string>([...current.keys(), ...previous.keys()])
  const categories = [...categoryKeys]
    .map((key) => {
      const cur = current.get(key) ?? 0
      const prev = previous.get(key) ?? 0
      return {
        category_id: key,
        name: categoryName.get(key) ?? 'Sin categoría',
        current: Math.round(cur),
        previous: Math.round(prev),
        delta_pct: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null,
      }
    })
    .sort((a, b) => b.current - a.current)

  // Budget utilization for the target period
  const budgets = ((budgetRes.data ?? []) as { category_id: string; amount: number; currency: Currency }[])
    .map((b) => {
      const budgetAmount = convert(b.amount || 0, b.currency, currency)
      const spent = current.get(b.category_id) ?? 0
      return {
        category_id: b.category_id,
        name: categoryName.get(b.category_id) ?? 'Sin categoría',
        budget_amount: Math.round(budgetAmount),
        spent: Math.round(spent),
        utilization_pct: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
      }
    })

  const goals = ((goalRes.data ?? []) as {
    name: string
    target_amount: number
    current_amount: number
    currency: Currency
    deadline: string | null
    is_completed: boolean
  }[])
    .filter((g) => !g.is_completed)
    .map((g) => ({
      name: g.name,
      target: Math.round(convert(g.target_amount || 0, g.currency, currency)),
      current: Math.round(convert(g.current_amount || 0, g.currency, currency)),
      progress_pct: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
      deadline: g.deadline,
    }))

  return {
    period,
    currency,
    hasData: transactionCount > 0,
    transactionCount,
    totals: { income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense) },
    categories,
    budgets,
    goals,
  }
}

// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------

function buildPrompt(summary: SpendingSummary): string {
  return `Eres un coach de finanzas personales. Analiza el siguiente resumen mensual de gastos
de un usuario (montos ya convertidos a ${summary.currency}) y genera consejos de ahorro
accionables y específicos, en español.

Resumen del periodo ${summary.period}:
${JSON.stringify(summary, null, 2)}

Reglas:
- Genera entre 2 y 5 "insights": observaciones concretas sobre dónde se va el dinero,
  tendencias mes a mes y presupuestos en riesgo. Usa "severity": "critical" si un presupuesto
  está excedido o un gasto creció mucho, "warning" si conviene vigilarlo, "info" en lo demás.
  Cuando un insight sea sobre una categoría, incluye su "category_id".
- Genera entre 1 y 5 "budget_suggestions": montos recomendados de presupuesto mensual por
  categoría, basados en el gasto real. Usa SOLO category_id y category_name que aparezcan en el
  resumen. Si la categoría ya tiene presupuesto, incluye "current_budget_amount".
- Sé breve y claro. Habla de "tú". No inventes cifras que no estén en el resumen.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta forma:
{
  "insights": [
    { "title": "...", "detail": "...", "severity": "info|warning|critical", "category_id": "<opcional>" }
  ],
  "budget_suggestions": [
    { "category_id": "...", "category_name": "...", "suggested_amount": <número>, "rationale": "...", "current_budget_amount": <opcional> }
  ]
}`
}

interface GenerateResult {
  success: boolean
  error?: string
  skipped?: boolean
  data?: { insights: SavingsInsight[]; budget_suggestions: SavingsBudgetSuggestion[] }
}

export async function generateSavingsAdvice(
  userId: string,
  period: string = currentPeriod()
): Promise<GenerateResult> {
  if (!userId) return { success: false, error: 'User ID is required' }

  try {
    const summary = await buildSpendingSummary(userId, period)

    // No spending this period → nothing to analyze, don't spend tokens.
    if (!summary.hasData) {
      return { success: true, skipped: true }
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: buildPrompt(summary) }],
    })

    const textContent = response.content.find((b) => b.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return { success: false, error: 'No se recibió respuesta del modelo' }
    }

    const clean = textContent.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const payload = savingsAdvicePayloadSchema.parse(JSON.parse(clean))

    // Refresh the cached row for (user, period): delete-then-insert, matching
    // the pattern used by updateExchangeRates (avoids relying on upsert).
    await insforgeAdmin.database
      .from('ai_savings_advice')
      .delete()
      .eq('user_id', userId)
      .eq('period', period)

    const { error: insertError } = await insforgeAdmin.database
      .from('ai_savings_advice')
      .insert({
        user_id: userId,
        period,
        currency: summary.currency,
        insights: payload.insights,
        budget_suggestions: payload.budget_suggestions,
      })

    if (insertError) throw insertError

    revalidatePath('/consejos-ahorro')
    return {
      success: true,
      data: {
        insights: payload.insights as SavingsInsight[],
        budget_suggestions: payload.budget_suggestions as SavingsBudgetSuggestion[],
      },
    }
  } catch (error) {
    console.error('generateSavingsAdvice error:', error)
    if (error instanceof SyntaxError) {
      return { success: false, error: 'El modelo no devolvió un JSON válido' }
    }
    return { success: false, error: 'Error al generar consejos de ahorro' }
  }
}

/** Reads the cached advice for a user/period (used by the panel page). */
export async function getSavingsAdvice(
  userId: string,
  period: string = currentPeriod()
): Promise<{ success: boolean; data?: AiSavingsAdvice | null; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required' }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('ai_savings_advice')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle()

    if (error) throw error
    return { success: true, data: (data as AiSavingsAdvice) ?? null }
  } catch (error) {
    console.error('getSavingsAdvice error:', error)
    return { success: false, error: 'Failed to fetch savings advice' }
  }
}
