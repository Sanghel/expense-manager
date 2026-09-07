import { reminderMatchesDate } from '@/lib/reminders/matches-date'
import { getLocalDateString } from '@/lib/utils/dates'
import type { ReminderWithCategory } from '@/types/database.types'

export type OccurrenceStatus = 'overdue' | 'today' | 'upcoming'

export interface ReminderOccurrence {
  reminder: ReminderWithCategory
  /** 'YYYY-MM-DD' of this occurrence. */
  date: string
  status: OccurrenceStatus
}

export interface OccurrenceTransaction {
  description: string
  category_id: string | null
  date: string
}

export interface OccurrenceDismissal {
  reminder_id: string
  occurrence_date: string
  snoozed_until: string | null
}

export interface PendingOptions {
  lookbackDays?: number
  lookaheadDays?: number
  today?: Date
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * Expands recurring reminder rules into the concrete occurrences that are
 * still pending inside a window around today.
 *
 * Reminders have no occurrence table, so "already settled" is inferred the
 * same way the Recordatorios tab does it: a transaction on that date with the
 * same description and category counts as the occurrence being handled.
 *
 * Pure — no I/O, so the caller decides what to fetch.
 */
export function getPendingOccurrences(
  reminders: ReminderWithCategory[],
  transactions: OccurrenceTransaction[],
  dismissals: OccurrenceDismissal[] = [],
  {
    lookbackDays = 7,
    lookaheadDays = 7,
    today = new Date(),
  }: PendingOptions = {}
): ReminderOccurrence[] {
  const todayStr = getLocalDateString(today)

  const settled = new Set(
    transactions.map((t) => `${t.date}|${t.description}|${t.category_id ?? ''}`)
  )

  const dismissedByKey = new Map(
    dismissals.map((d) => [`${d.reminder_id}|${d.occurrence_date}`, d])
  )

  const occurrences: ReminderOccurrence[] = []

  for (let offset = -lookbackDays; offset <= lookaheadDays; offset++) {
    const date = addDays(today, offset)
    const dateStr = getLocalDateString(date)

    for (const reminder of reminders) {
      if (!reminderMatchesDate(reminder, date)) continue

      if (
        settled.has(
          `${dateStr}|${reminder.description}|${reminder.category_id ?? ''}`
        )
      ) {
        continue
      }

      const dismissal = dismissedByKey.get(`${reminder.id}|${dateStr}`)
      if (dismissal) {
        // A plain dismissal hides the occurrence for good; a snooze only hides
        // it until the chosen date.
        if (!dismissal.snoozed_until) continue
        if (dismissal.snoozed_until > todayStr) continue
      }

      const status: OccurrenceStatus =
        dateStr === todayStr
          ? 'today'
          : dateStr < todayStr
            ? 'overdue'
            : 'upcoming'

      occurrences.push({ reminder, date: dateStr, status })
    }
  }

  return occurrences.sort((a, b) => a.date.localeCompare(b.date))
}

/** Count that belongs on the bell badge: what is already due. */
export function countActionable(occurrences: ReminderOccurrence[]): number {
  return occurrences.filter((o) => o.status !== 'upcoming').length
}
