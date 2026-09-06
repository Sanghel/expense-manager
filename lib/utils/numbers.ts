/**
 * Coerces a value coming from the database to a number.
 *
 * Postgres `numeric` columns are serialized as strings by the InsForge SDK, so
 * arithmetic on a raw field silently concatenates instead of adding.
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

/**
 * Division that never yields NaN or Infinity — returns 0 when the denominator
 * is missing, zero or not a finite number.
 */
export function safeRatio(numerator: unknown, denominator: unknown): number {
  const den = toNumber(denominator)
  if (den <= 0) return 0
  return toNumber(numerator) / den
}
