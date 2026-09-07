import { addMonths, addYears, endOfDay, parseISO, startOfDay, subDays } from 'date-fns'
import type { BudgetPeriod } from '@/types/database.types'

export interface ResolvedPeriod {
  periodStart: Date
  periodEnd: Date
}

/**
 * Resolves the currently active cycle of a budget.
 *
 * Uses date-fns rather than `new Date(y, m + n, d)`, which overflows: a budget
 * starting Jan 31 produced a period starting Mar 3. `addMonths` clamps to the
 * last day of the target month instead. `parseISO` also avoids the UTC shift
 * `new Date('YYYY-MM-DD')` introduces in negative offsets.
 */
export function resolvePeriod(
  startDate: string,
  period: BudgetPeriod,
  now: Date = new Date()
): ResolvedPeriod {
  const start = startOfDay(parseISO(startDate))
  const step = (date: Date, n: number) =>
    period === 'monthly' ? addMonths(date, n) : addYears(date, n)

  // Budget starts in the future — the first cycle is the active one.
  if (now < start) {
    return { periodStart: start, periodEnd: endOfDay(subDays(step(start, 1), 1)) }
  }

  let cyclesElapsed = 0
  // Cycle lengths vary (month lengths, leap years), so walk forward rather
  // than dividing. Budgets are user-scale, so this stays cheap.
  while (step(start, cyclesElapsed + 1) <= now) {
    cyclesElapsed += 1
  }

  const periodStart = step(start, cyclesElapsed)
  return { periodStart, periodEnd: endOfDay(subDays(step(start, cyclesElapsed + 1), 1)) }
}
