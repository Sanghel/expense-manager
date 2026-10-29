export function getLocalDateString(date: Date = new Date()): string {
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
