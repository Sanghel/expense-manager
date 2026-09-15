import {
  splitBudgetsByScope,
  sortByConsumption,
  buildGroupBreakdown,
} from '../lib/utils/budget-grouping'
import type { BudgetWithSpent, CategoryGroupWithMembers } from '../types/database.types'

/** Construye un BudgetWithSpent mínimo; solo importan los campos que el módulo lee. */
function budget(partial: Partial<BudgetWithSpent>): BudgetWithSpent {
  return {
    id: 'b',
    user_id: 'u',
    scope: 'category',
    category_id: null,
    group_id: null,
    amount_type: 'fixed',
    amount: 0,
    percent: null,
    currency: 'COP',
    period: 'monthly',
    start_date: '2026-10-01',
    created_at: '2026-09-15T00:00:00Z',
    category: null,
    group: null,
    spent: 0,
    limit_amount: 0,
    periodIncome: 0,
    periodExpense: 0,
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    ...partial,
  } as BudgetWithSpent
}

const grupoOcio: CategoryGroupWithMembers = {
  id: 'g1',
  user_id: 'u',
  name: 'Estilo de Vida',
  icon: '🎈',
  color: null,
  created_at: '2026-09-15T00:00:00Z',
  category_ids: ['c1', 'c2', 'c3'],
}

let passed = 0
let failed = 0

function check(name: string, ok: boolean, extra?: unknown) {
  if (ok) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.error(`  ❌ ${name}`)
    if (extra !== undefined) console.error('     got', extra)
  }
}

// --- splitBudgetsByScope ---
{
  const all = [
    budget({ id: 'g', scope: 'group', group_id: 'g1' }),
    budget({ id: 'c', scope: 'category', category_id: 'c1' }),
    budget({ id: 't', scope: 'total' }),
  ]
  const r = splitBudgetsByScope(all)
  check('split: separa los tres scopes',
    r.groups.length === 1 && r.categories.length === 1 && r.total.length === 1, r)
}

// --- sortByConsumption ---
{
  const r = sortByConsumption([
    budget({ id: 'bajo', spent: 10, limit_amount: 100 }),
    budget({ id: 'alto', spent: 90, limit_amount: 100 }),
    budget({ id: 'medio', spent: 50, limit_amount: 100 }),
  ])
  check('orden: descendente por consumo',
    r.map((b) => b.id).join(',') === 'alto,medio,bajo', r.map((b) => b.id))
}
{
  // limit_amount 0 no debe producir NaN ni romper el orden
  const r = sortByConsumption([
    budget({ id: 'cero', spent: 10, limit_amount: 0 }),
    budget({ id: 'alto', spent: 90, limit_amount: 100 }),
  ])
  check('orden: límite cero va al final sin NaN',
    r.map((b) => b.id).join(',') === 'alto,cero', r.map((b) => b.id))
}

// --- buildGroupBreakdown ---
{
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 1000, limit_amount: 1500 })
  const cats = [
    budget({ id: 'c1', category_id: 'c1', spent: 400, limit_amount: 500 }), // 80%
    budget({ id: 'c2', category_id: 'c2', spent: 300, limit_amount: 1000 }), // 30%
  ]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: residual positivo = 1000 - 700', r.residual === 300, r.residual)
  check('breakdown: miembros ordenados por consumo desc',
    r.members.map((m) => m.budget.id).join(',') === 'c1,c2', r.members.map((m) => m.budget.id))
  check('breakdown: ratio calculado', Math.abs(r.members[0].ratio - 0.8) < 1e-9, r.members[0]?.ratio)
}
{
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 700, limit_amount: 1500 })
  const cats = [budget({ id: 'c1', category_id: 'c1', spent: 700, limit_amount: 1000 })]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: residual cero cuando los miembros cubren el total', r.residual === 0, r.residual)
}
{
  // Periodos desalineados pueden dar residual negativo: debe quedar en 0, nunca negativo.
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 500, limit_amount: 1500 })
  const cats = [budget({ id: 'c1', category_id: 'c1', spent: 900, limit_amount: 1000 })]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: residual negativo se normaliza a 0', r.residual === 0, r.residual)
}
{
  // Categorías que NO pertenecen al grupo no entran ni en miembros ni en el residual.
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: 1000, limit_amount: 1500 })
  const cats = [
    budget({ id: 'dentro', category_id: 'c1', spent: 400, limit_amount: 500 }),
    budget({ id: 'fuera', category_id: 'zzz', spent: 999, limit_amount: 999 }),
  ]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: ignora categorías ajenas al grupo',
    r.members.length === 1 && r.members[0].budget.id === 'dentro' && r.residual === 600, r)
}
{
  const g = budget({ id: 'g', scope: 'group', group_id: 'inexistente', spent: 300, limit_amount: 500 })
  const r = buildGroupBreakdown(g, [], [grupoOcio])
  check('breakdown: grupo sin miembros -> residual = gasto del grupo',
    r.members.length === 0 && r.residual === 300, r)
}
{
  // El SDK de InsForge entrega numeric como string: no debe concatenar.
  const g = budget({ id: 'g', scope: 'group', group_id: 'g1', spent: '1000' as unknown as number, limit_amount: 1500 })
  const cats = [budget({ id: 'c1', category_id: 'c1', spent: '400' as unknown as number, limit_amount: 500 })]
  const r = buildGroupBreakdown(g, cats, [grupoOcio])
  check('breakdown: coerciona strings numéricos', r.residual === 600, r.residual)
}

console.log(`\n${passed}/${passed + failed} checks passed`)
if (failed > 0) process.exit(1)
