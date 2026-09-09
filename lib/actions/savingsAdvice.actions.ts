'use server'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { savingsAdvicePayloadSchema } from '@/lib/validations/savingsAdvice'
import { buildConverter, type RateRow } from '@/lib/utils/currency-converter'
import type {
  AiSavingsAdvice,
  CategoryGroupWithMembers,
  Currency,
  SavingsInsight,
  SavingsBudgetSuggestion,
  SavingsGoalSuggestion,
  SavingsGroupSuggestion,
  SavingsCategorySuggestion,
} from '@/types/database.types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // The SDK already retries 408/409/429/5xx and connection errors; three
  // attempts gives the monthly cron a bit more room than the default two,
  // since a failed run leaves the user with no advice until next month.
  maxRetries: 3,
})

/**
 * Room for the largest response the prompt can ask for: 5 insights + 5 budget
 * suggestions + 3 goals, each with Spanish prose and a UUID `category_id`
 * (~25 tokens each). The previous 1500 fit a small account and truncated a
 * large one mid-JSON — the intermittent failure this module was known for.
 */
const MAX_TOKENS = 8000

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

// ---------------------------------------------------------------------------
// Aggregation — compact spending summary fed to the model (no raw rows)
// ---------------------------------------------------------------------------

// Number of months (including the current one) used to compute the averages
// that feed the savings-capacity card and goal suggestions.
const AVG_WINDOW_MONTHS = 6

export interface SpendingSummary {
  period: string
  currency: Currency
  hasData: boolean
  transactionCount: number
  totals: { income: number; expense: number; net: number }
  // Averages over the months with activity in the last AVG_WINDOW_MONTHS.
  avgMonthlyIncome: number
  avgMonthlyExpense: number
  monthlySavingsCapacity: number
  monthsAnalyzed: number
  categories: {
    category_id: string
    name: string
    current: number
    previous: number
    delta_pct: number | null
    /** Transactions this period. */
    tx_count: number
    /**
     * Median transaction amount this period. This — not the category's name —
     * is what identifies an "ant expense": a low median with a high count.
     * Without it the model assumes e.g. clothing is an ant expense when its
     * median ticket says otherwise.
     */
    median_ticket: number
  }[]
  budgets: { category_id: string; name: string; budget_amount: number; spent: number; utilization_pct: number }[]
  goals: { name: string; target: number; current: number; progress_pct: number; deadline: string | null }[]
  /** Existing category groups with their aggregated spend. */
  groups: { group_id: string; name: string; category_ids: string[]; current: number; tx_count: number }[]
  /**
   * Facts about how the categories themselves are organised, computed here
   * rather than inferred by the model — duplicate names and uncategorised
   * totals are exact arithmetic, and asking the model to derive them would
   * trade precision for nothing.
   */
  hygiene: {
    duplicate_names: { name: string; category_ids: string[] }[]
    uncategorized: { tx_count: number; amount: number; pct_of_expense: number }
    /** Categories used 3 times or less in the window. */
    rarely_used: { category_id: string; name: string; tx_count: number }[]
    total_categories: number
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/** Lowercased, unaccented, trimmed — so "Transporte " and "transporte" collide. */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export async function buildSpendingSummary(
  userId: string,
  period: string = currentPeriod()
): Promise<SpendingSummary> {
  const prevPeriod = shiftPeriod(period, -1)
  // Fetch a wider window so we can compute monthly averages, not just the two
  // most recent months used for the category breakdown.
  const since = `${shiftPeriod(period, -(AVG_WINDOW_MONTHS - 1))}-01`

  // Resolve preferred currency
  const { data: user } = await insforgeAdmin.database
    .from('users')
    .select('preferred_currency')
    .eq('id', userId)
    .single()
  const currency = (user?.preferred_currency ?? 'COP') as Currency

  // Load the data we need in parallel
  const [txRes, catRes, budgetRes, goalRes, ratePairs, groupsResult] = await Promise.all([
    insforgeAdmin.database
      .from('transactions')
      .select('amount, currency, type, category_id, date')
      .eq('user_id', userId)
      .gte('date', since),
    insforgeAdmin.database.from('categories').select('id, name, type'),
    insforgeAdmin.database
      .from('budgets')
      .select('category_id, amount, currency')
      .eq('user_id', userId)
      // The advisor maps budgets by category and reads a fixed amount; group
      // and percentage budgets have neither, so they are excluded here.
      .eq('scope', 'category')
      .eq('amount_type', 'fixed'),
    insforgeAdmin.database
      .from('savings_goals')
      .select('name, target_amount, current_amount, currency, deadline, is_completed')
      .eq('user_id', userId),
    getAllRatePairs(),
    getCategoryGroups(userId),
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
  // Every expense amount of the period, per category, for the median ticket.
  const amountsByCategory = new Map<string, number[]>()
  // Income/expense per month within the window, for the averages.
  const monthly = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    const amount = convert(t.amount || 0, t.currency, currency)

    const monthKey = typeof t.date === 'string' ? t.date.slice(0, 7) : ''
    if (monthKey && monthKey <= period) {
      const bucket = monthly.get(monthKey) ?? { income: 0, expense: 0 }
      if (t.type === 'income') bucket.income += amount
      else bucket.expense += amount
      monthly.set(monthKey, bucket)
    }

    if (inPeriod(t.date, period)) {
      transactionCount++
      if (t.type === 'income') income += amount
      else {
        expense += amount
        const key = t.category_id ?? 'sin-categoria'
        current.set(key, (current.get(key) ?? 0) + amount)
        const amounts = amountsByCategory.get(key) ?? []
        amounts.push(amount)
        amountsByCategory.set(key, amounts)
      }
    } else if (inPeriod(t.date, prevPeriod) && t.type === 'expense') {
      const key = t.category_id ?? 'sin-categoria'
      previous.set(key, (previous.get(key) ?? 0) + amount)
    }
  }

  // Averages over the months that actually have activity in the window.
  const monthsAnalyzed = monthly.size
  const sumIncome = [...monthly.values()].reduce((s, m) => s + m.income, 0)
  const sumExpense = [...monthly.values()].reduce((s, m) => s + m.expense, 0)
  const avgMonthlyIncome = monthsAnalyzed > 0 ? Math.round(sumIncome / monthsAnalyzed) : 0
  const avgMonthlyExpense = monthsAnalyzed > 0 ? Math.round(sumExpense / monthsAnalyzed) : 0
  const monthlySavingsCapacity = avgMonthlyIncome - avgMonthlyExpense

  const categoryKeys = new Set<string>([...current.keys(), ...previous.keys()])
  const categories = [...categoryKeys]
    .map((key) => {
      const cur = current.get(key) ?? 0
      const prev = previous.get(key) ?? 0
      const amounts = amountsByCategory.get(key) ?? []
      return {
        category_id: key,
        name: categoryName.get(key) ?? 'Sin categoría',
        current: Math.round(cur),
        previous: Math.round(prev),
        delta_pct: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null,
        tx_count: amounts.length,
        median_ticket: Math.round(median(amounts)),
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

  // Groups with their aggregated spend, so the model can reason in "kinds of
  // spending" instead of only per fixed category.
  const groupRows = (groupsResult.success ? (groupsResult.data ?? []) : []) as CategoryGroupWithMembers[]
  const groups = groupRows.map((g) => {
    const members = new Set(g.category_ids)
    let spend = 0
    let count = 0
    for (const [key, amount] of current.entries()) {
      if (!members.has(key)) continue
      spend += amount
      count += amountsByCategory.get(key)?.length ?? 0
    }
    return {
      group_id: g.id,
      name: g.name,
      category_ids: g.category_ids,
      current: Math.round(spend),
      tx_count: count,
    }
  })

  // Category hygiene — exact arithmetic, so it is computed here rather than
  // asked of the model.
  const allCategories = (catRes.data ?? []) as { id: string; name: string }[]
  const byNormalized = new Map<string, string[]>()
  for (const c of allCategories) {
    const key = normalizeName(c.name)
    byNormalized.set(key, [...(byNormalized.get(key) ?? []), c.id])
  }
  const duplicate_names = [...byNormalized.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({
      name: allCategories.find((c) => normalizeName(c.name) === key)?.name ?? key,
      category_ids: ids,
    }))

  const uncategorizedAmount = current.get('sin-categoria') ?? 0
  const uncategorizedCount = amountsByCategory.get('sin-categoria')?.length ?? 0

  const rarely_used = categories
    .filter((c) => c.category_id !== 'sin-categoria' && c.tx_count > 0 && c.tx_count <= 3)
    .map((c) => ({ category_id: c.category_id, name: c.name, tx_count: c.tx_count }))

  return {
    period,
    currency,
    hasData: transactionCount > 0,
    transactionCount,
    totals: { income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense) },
    avgMonthlyIncome,
    avgMonthlyExpense,
    monthlySavingsCapacity,
    monthsAnalyzed,
    categories,
    budgets,
    goals,
    groups,
    hygiene: {
      duplicate_names,
      uncategorized: {
        tx_count: uncategorizedCount,
        amount: Math.round(uncategorizedAmount),
        pct_of_expense: expense > 0 ? Math.round((uncategorizedAmount / expense) * 100) : 0,
      },
      rarely_used,
      total_categories: allCategories.length,
    },
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
- Genera entre 1 y 3 "goal_suggestions": metas de ahorro realistas basadas en la capacidad de
  ahorro mensual (campo "monthlySavingsCapacity" = ingreso prom. − gasto prom.) y en los promedios
  mensuales. Cada meta lleva "name" (ej. "Fondo de emergencia", "Ahorro para vacaciones"),
  "target_amount" (monto objetivo total), "monthly_contribution" (aporte mensual sugerido, que NO
  debe exceder la capacidad de ahorro), "deadline" (fecha YYYY-MM-DD coherente con target/aporte) y
  "rationale". Si la capacidad de ahorro es <= 0, propón primero reducir gastos y sugiere metas
  pequeñas o ninguna.
- Genera entre 0 y 3 "group_suggestions": grupos de categorías que convenga presupuestar
  juntas. Usa SOLO category_id que aparezcan en el resumen y no propongas un grupo que ya
  exista en "groups". Guíate por "median_ticket" y "tx_count", NO por el nombre de la
  categoría: un gasto hormiga es mediana baja con muchas transacciones. Una categoría con
  mediana alta y pocas transacciones es una compra grande, aunque suene a capricho.
- Genera entre 0 y 4 "category_suggestions" a partir de "hygiene", sin inventar nada:
  "merge" para los nombres duplicados que ya vienen en "duplicate_names" o para categorías
  claramente solapadas; "categorize" si "uncategorized.pct_of_expense" es relevante;
  "review" para las de "rarely_used". Si la higiene está bien, devuelve una lista vacía en
  lugar de forzar sugerencias.
- Sé breve y claro. Habla de "tú". No inventes cifras que no estén en el resumen.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta forma:
{
  "insights": [
    { "title": "...", "detail": "...", "severity": "info|warning|critical", "category_id": "<opcional>" }
  ],
  "budget_suggestions": [
    { "category_id": "...", "category_name": "...", "suggested_amount": <número>, "rationale": "...", "current_budget_amount": <opcional> }
  ],
  "goal_suggestions": [
    { "name": "...", "target_amount": <número>, "monthly_contribution": <número>, "deadline": "YYYY-MM-DD", "rationale": "..." }
  ],
  "group_suggestions": [
    { "name": "...", "category_ids": ["...", "..."], "category_names": ["...", "..."], "rationale": "..." }
  ],
  "category_suggestions": [
    { "kind": "merge|rename|categorize|review", "title": "...", "detail": "...", "category_ids": ["..."] }
  ]
}`
}

interface GenerateResult {
  success: boolean
  error?: string
  skipped?: boolean
  data?: {
    insights: SavingsInsight[]
    budget_suggestions: SavingsBudgetSuggestion[]
    goal_suggestions: SavingsGoalSuggestion[]
    group_suggestions: SavingsGroupSuggestion[]
    category_suggestions: SavingsCategorySuggestion[]
  }
}

export async function generateSavingsAdvice(
  userId: string,
  period: string = currentPeriod()
): Promise<GenerateResult> {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  try {
    const summary = await buildSpendingSummary(userId, period)

    // No spending this period → nothing to analyze, don't spend tokens.
    if (!summary.hasData) {
      return { success: true, skipped: true }
    }

    // The schema is the contract, not a suggestion in the prompt: the model
    // cannot return anything that fails it, so the old "strip ``` fences and
    // hope JSON.parse works" path is gone.
    const request = {
      model: 'claude-haiku-4-5',
      max_tokens: MAX_TOKENS,
      output_config: { format: zodOutputFormat(savingsAdvicePayloadSchema) },
      messages: [{ role: 'user' as const, content: buildPrompt(summary) }],
    }

    let response = await client.messages.parse(request)

    // A truncated response is not a malformed one — it used to surface as
    // "JSON inválido", which pointed at the wrong cause. Retry once asking for
    // less, rather than failing the whole month.
    if (response.stop_reason === 'max_tokens') {
      console.warn(`generateSavingsAdvice: respuesta truncada para user=${userId}, reintentando más corto`)
      response = await client.messages.parse({
        ...request,
        messages: [
          {
            role: 'user' as const,
            content: `${buildPrompt(summary)}\n\nIMPORTANTE: sé más breve. Genera como máximo 3 insights, 3 sugerencias de presupuesto y 1 meta, con justificaciones de una sola frase.`,
          },
        ],
      })

      if (response.stop_reason === 'max_tokens') {
        return {
          success: false,
          error: 'El análisis salió demasiado largo. Vuelve a intentarlo.',
        }
      }
    }

    if (response.stop_reason === 'refusal') {
      return { success: false, error: 'El modelo no pudo procesar este análisis.' }
    }

    const payload = response.parsed_output
    if (!payload) {
      return { success: false, error: 'No se recibió respuesta del modelo' }
    }

    const row = {
      user_id: userId,
      period,
      currency: summary.currency,
      insights: payload.insights,
      budget_suggestions: payload.budget_suggestions,
      goal_suggestions: payload.goal_suggestions,
      group_suggestions: payload.group_suggestions,
      category_suggestions: payload.category_suggestions,
    }

    // Update in place when a row exists. The previous delete-then-insert left
    // the user with nothing at all if the insert failed.
    const { data: existing, error: existingError } = await insforgeAdmin.database
      .from('ai_savings_advice')
      .select('id')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle()

    if (existingError) throw existingError

    const { error: writeError } = existing
      ? await insforgeAdmin.database
          .from('ai_savings_advice')
          .update({ ...row, generated_at: new Date().toISOString() })
          .eq('id', existing.id)
      : await insforgeAdmin.database.from('ai_savings_advice').insert(row)

    if (writeError) throw writeError

    revalidatePath('/consejos-ahorro')
    return {
      success: true,
      data: {
        insights: payload.insights as SavingsInsight[],
        budget_suggestions: payload.budget_suggestions as SavingsBudgetSuggestion[],
        goal_suggestions: payload.goal_suggestions as SavingsGoalSuggestion[],
        group_suggestions: payload.group_suggestions as SavingsGroupSuggestion[],
        category_suggestions: payload.category_suggestions as SavingsCategorySuggestion[],
      },
    }
  } catch (error) {
    console.error('generateSavingsAdvice error:', error)

    if (error instanceof Anthropic.RateLimitError) {
      return { success: false, error: 'La IA está saturada ahora mismo. Inténtalo en unos minutos.' }
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return { success: false, error: 'La clave de la API de Anthropic no es válida.' }
    }
    if (error instanceof Anthropic.APIError) {
      return { success: false, error: `Error de la IA (${error.status}): ${error.message}` }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al generar consejos de ahorro',
    }
  }
}

/**
 * Removes a single suggestion from the cached advice so it stops appearing.
 * Persists in place (update, preserving `generated_at`) instead of
 * delete-then-insert, since this is an edit of an existing analysis — not a
 * fresh generation. Budget suggestions are keyed by `category_id`, goal
 * suggestions by `name`.
 */
export async function dismissSuggestion(
  userId: string,
  period: string,
  kind: 'budget' | 'goal' | 'group' | 'category',
  key: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required' }
  if (!key) return { success: false, error: 'Suggestion key is required' }

  try {
    const { data, error } = await insforgeAdmin.database
      .from('ai_savings_advice')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle()

    if (error) throw error
    if (!data) return { success: true }

    const row = data as AiSavingsAdvice
    // Budget suggestions are keyed by category_id; the rest by name/title.
    const patch =
      kind === 'budget'
        ? { budget_suggestions: row.budget_suggestions.filter((s) => s.category_id !== key) }
        : kind === 'goal'
          ? { goal_suggestions: row.goal_suggestions.filter((s) => s.name !== key) }
          : kind === 'group'
            ? { group_suggestions: (row.group_suggestions ?? []).filter((s) => s.name !== key) }
            : { category_suggestions: (row.category_suggestions ?? []).filter((s) => s.title !== key) }

    const { error: updateError } = await insforgeAdmin.database
      .from('ai_savings_advice')
      .update(patch)
      .eq('user_id', userId)
      .eq('period', period)

    if (updateError) throw updateError

    revalidatePath('/consejos-ahorro')
    return { success: true }
  } catch (error) {
    console.error('dismissSuggestion error:', error)
    return { success: false, error: 'No se pudo descartar la sugerencia' }
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
