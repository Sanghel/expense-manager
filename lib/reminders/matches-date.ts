import type { Reminder, ReminderWithCategory } from '@/types/database.types'

/** The fields that define when a reminder is due. */
export type ReminderRule = Pick<
  Reminder,
  'is_active' | 'frequency' | 'specific_date' | 'day_of_week' | 'day_of_month' | 'month_of_year'
>
import { getLocalDateString } from '@/lib/utils/dates'

function lastDayOfMonth(year: number, monthZeroBased: number): number {
  return new Date(year, monthZeroBased + 1, 0).getDate()
}

export function reminderMatchesDate(reminder: ReminderRule, date: Date): boolean {
  if (!reminder.is_active) return false

  const dayOfWeek = date.getDay()
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()
  const dateStr = getLocalDateString(date)

  switch (reminder.frequency) {
    case 'once':
      return reminder.specific_date === dateStr
    case 'weekly':
      return reminder.day_of_week === dayOfWeek
    case 'monthly': {
      const last = lastDayOfMonth(year, month)
      const target = Math.min(reminder.day_of_month ?? 0, last)
      return target === day
    }
    case 'yearly': {
      if (reminder.month_of_year !== month + 1) return false
      const last = lastDayOfMonth(year, month)
      const target = Math.min(reminder.day_of_month ?? 0, last)
      return target === day
    }
    default:
      return false
  }
}

export function remindersForDate(
  reminders: ReminderWithCategory[],
  date: Date,
): ReminderWithCategory[] {
  return reminders.filter((r) => reminderMatchesDate(r, date))
}

/**
 * Next date (today included) on which the reminder is due, looking up to a
 * year ahead. Null for inactive or past one-off reminders.
 */
export function nextOccurrence(reminder: ReminderRule, from: Date = new Date()): Date | null {
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = 0; i <= 366; i++) {
    if (reminderMatchesDate(reminder, day)) return day
    day.setDate(day.getDate() + 1)
  }
  return null
}
