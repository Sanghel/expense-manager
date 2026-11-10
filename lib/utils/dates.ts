/**
 * The app's calendar runs on Colombia time. The server (Vercel) runs in UTC,
 * so "today" computed with the machine clock is tomorrow there after 7pm
 * Bogotá — which made reminder occurrences and payments disagree.
 */
export const APP_TIME_ZONE = 'America/Bogota'

/** Today's 'YYYY-MM-DD' in the app time zone, whatever machine runs it. */
export function todayString(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * Today in the app time zone as a local Date at noon, for calendar arithmetic
 * (getDate/setDate) that must agree with todayString() on any machine.
 */
export function appToday(now: Date = new Date()): Date {
  const [year, month, day] = todayString(now).split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

/**
 * 'YYYY-MM-DD' of a calendar Date built with local getters. Without an
 * argument it returns today in the app time zone (see todayString).
 */
export function getLocalDateString(date?: Date): string {
  if (!date) return todayString()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** "JUE 29 OCT 2026": today's date for the page header eyebrow. */
export function todayEyebrow(): string {
  return new Date()
    .toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/[.,]/g, '')
    .replace(/ de /g, ' ')
}

/** Copy of a calendar Date moved by whole days (local getters/setters). */
export function shiftDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
