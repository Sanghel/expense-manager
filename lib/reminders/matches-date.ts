import type { ReminderWithCategory } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

export function reminderMatchesDate(reminder: ReminderWithCategory, date: Date): boolean {
  if (!reminder.is_active) return false

  const dayOfWeek = date.getDay()
  const day = date.getDate()
  const month = date.getMonth()
  const dateStr = getLocalDateString(date)

  switch (reminder.frequency) {
    case 'once':
      return reminder.specific_date === dateStr
    case 'weekly':
      return reminder.day_of_week === dayOfWeek
    case 'monthly':
      return reminder.day_of_month === day
    case 'yearly':
      return reminder.day_of_month === day && reminder.month_of_year === month + 1
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
