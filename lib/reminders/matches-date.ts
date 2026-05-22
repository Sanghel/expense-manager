import type { ReminderWithCategory } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

function lastDayOfMonth(year: number, monthZeroBased: number): number {
  return new Date(year, monthZeroBased + 1, 0).getDate()
}

export function reminderMatchesDate(reminder: ReminderWithCategory, date: Date): boolean {
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
