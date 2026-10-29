import { differenceInCalendarMonths } from 'date-fns'
import { toNumber } from '@/lib/utils/numbers'
import type { SavingsGoal } from '@/types/database.types'

export type PaceStatus = 'on-track' | 'behind' | 'overdue' | 'done'

export interface SavingsPace {
  remaining: number
  monthsLeft: number
  requiredMonthly: number
  observedMonthly: number
  status: PaceStatus
}

/**
 * Derives the contribution rhythm a goal needs versus the one it has had, so
 * the card can answer "¿voy bien?" instead of only showing a bar.
 *
 * Returns null when there is no deadline to measure against.
 */
export function getSavingsPace(goal: SavingsGoal, now = new Date()): SavingsPace | null {
  if (!goal.deadline) return null

  const current = toNumber(goal.current_amount)
  const target = toNumber(goal.target_amount)
  const remaining = Math.max(target - current, 0)

  if (remaining === 0 || goal.is_completed) {
    return { remaining: 0, monthsLeft: 0, requiredMonthly: 0, observedMonthly: 0, status: 'done' }
  }

  const deadline = new Date(goal.deadline)
  if (Number.isNaN(deadline.getTime())) return null

  const monthsLeft = differenceInCalendarMonths(deadline, now)

  if (monthsLeft < 0) {
    return { remaining, monthsLeft, requiredMonthly: remaining, observedMonthly: 0, status: 'overdue' }
  }

  // A deadline inside the current month still needs the whole remainder.
  const requiredMonthly = remaining / Math.max(monthsLeft, 1)

  const created = new Date(goal.created_at)
  const monthsElapsed = Number.isNaN(created.getTime())
    ? 0
    : Math.max(differenceInCalendarMonths(now, created), 0)
  const observedMonthly = monthsElapsed > 0 ? current / monthsElapsed : current

  // Within 25% of the required rate still counts as keeping up.
  const status: PaceStatus = observedMonthly >= requiredMonthly * 0.75 ? 'on-track' : 'behind'

  return { remaining, monthsLeft, requiredMonthly, observedMonthly, status }
}

/**
 * Where the goal should be today (0-100) if saved evenly from its creation to
 * the deadline, and how many months of that even rhythm it is behind.
 * Null without a valid deadline.
 */
export function getExpectedProgress(
  goal: SavingsGoal,
  now = new Date()
): { percent: number; monthsBehind: number } | null {
  if (!goal.deadline) return null
  const start = new Date(goal.created_at).getTime()
  const end = new Date(goal.deadline).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null

  const percent = Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100))
  const target = toNumber(goal.target_amount)
  const totalMonths = Math.max(differenceInCalendarMonths(new Date(end), new Date(start)), 1)
  const behindAmount = (percent / 100) * target - toNumber(goal.current_amount)
  const monthsBehind = behindAmount > 0 ? Math.round(behindAmount / (target / totalMonths)) : 0

  return { percent, monthsBehind }
}
