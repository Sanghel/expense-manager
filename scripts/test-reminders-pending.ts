import {
  buildSettledSet,
  getPendingOccurrences,
  isOccurrenceSettled,
  nextPendingOccurrence,
  type OccurrenceTransaction,
} from '../lib/reminders/pending'
import { appToday, getLocalDateString, todayString } from '../lib/utils/dates'
import type { ReminderWithCategory } from '../types/database.types'

/** Recordatorio mínimo; solo importan los campos que el módulo lee. */
function reminder(partial: Partial<ReminderWithCategory>): ReminderWithCategory {
  return {
    id: 'r1',
    user_id: 'u',
    description: 'Pago de Servicios',
    type: 'expense',
    category_id: 'cat-servicios',
    account_id: null,
    frequency: 'monthly',
    day_of_week: null,
    day_of_month: 3,
    month_of_year: null,
    specific_date: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    category: null,
    ...partial,
  } as ReminderWithCategory
}

function tx(date: string, partial: Partial<OccurrenceTransaction> = {}): OccurrenceTransaction {
  return { date, description: 'Pago de Servicios', category_id: 'cat-servicios', ...partial }
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

// Hoy fijo: 10 nov 2026 (mediodía local), el recordatorio vence el día 3.
const today = new Date(2026, 10, 10, 12)
const servicios = reminder({})

// --- vencido sin pagar ---
{
  const occ = getPendingOccurrences([servicios], [], [], { today })
  check('vencido: aparece el 3 de noviembre como overdue',
    occ.length === 1 && occ[0].date === '2026-11-03' && occ[0].status === 'overdue', occ)
}

// --- pagado con la fecha de la ocurrencia ---
{
  const occ = getPendingOccurrences([servicios], [tx('2026-11-03')], [], { today })
  check('pago con fecha de la ocurrencia: ya no está pendiente', occ.length === 0, occ)
}

// --- pagado con la fecha de hoy (el bug anterior) no salda la ocurrencia del 3 ---
{
  const occ = getPendingOccurrences([servicios], [tx('2026-11-10')], [], { today })
  check('pago con otra fecha: la ocurrencia sigue pendiente', occ.length === 1, occ)
}

// --- coincidencia exacta de descripción y categoría ---
{
  const settled = buildSettledSet([tx('2026-11-03', { category_id: 'otra' })])
  check('otra categoría no salda', !isOccurrenceSettled(servicios, '2026-11-03', settled))
  const sinCat = reminder({ category_id: null })
  check('categoría null coincide con null',
    isOccurrenceSettled(sinCat, '2026-11-03', buildSettledSet([tx('2026-11-03', { category_id: null })])))
}

// --- próximo pendiente: si hoy ya se pagó, salta al siguiente mes ---
{
  const hoy = new Date(2026, 10, 3, 12)
  const sinPagar = nextPendingOccurrence(servicios, new Set(), hoy)
  check('próximo sin pagos: hoy', sinPagar !== null && getLocalDateString(sinPagar) === '2026-11-03', sinPagar)
  const pagado = nextPendingOccurrence(servicios, buildSettledSet([tx('2026-11-03')]), hoy)
  check('próximo con hoy pagado: 3 de diciembre',
    pagado !== null && getLocalDateString(pagado) === '2026-12-03', pagado)
}

// --- zona horaria: 10 nov 21:00 en Bogotá = 11 nov 02:00 UTC ---
{
  const lateNight = new Date('2026-11-11T02:00:00Z')
  check('todayString usa America/Bogota', todayString(lateNight) === '2026-11-10', todayString(lateNight))
  const d = appToday(lateNight)
  check('appToday da el día de Bogotá', getLocalDateString(d) === '2026-11-10', d)
}

console.log(`\n${passed}/${passed + failed} checks passed`)
if (failed > 0) process.exit(1)
