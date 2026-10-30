import type { Currency } from '@/types/database.types'

export const CURRENCIES: Currency[] = ['COP', 'USD', 'VES']
export const CURRENCY_SYMBOL: Record<Currency, string> = { COP: 'COP', USD: 'US$', VES: 'Bs' }

/** COP has no cents in practice; USD/VES keep them. */
export const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

/** "45000,5" → "45.000,5" while typing (es-CO: dot thousands, comma decimals). */
export function formatTyping(raw: string): string {
  const cleaned = raw.replace(/[^0-9,]/g, '')
  const [int, ...rest] = cleaned.split(',')
  const intFormatted = int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return rest.length > 0 ? `${intFormatted},${rest.join('').slice(0, 2)}` : intFormatted
}

export function parseTyping(text: string): number | undefined {
  const n = Number(text.replace(/\./g, '').replace(',', '.'))
  return text && Number.isFinite(n) && n > 0 ? n : undefined
}

/** 45000.5 → "45.000,5": the typing format for an amount that comes from data. */
export function toTypingText(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return ''
  const [int, dec = ''] = amount.toFixed(2).split('.')
  const decimals = dec.replace(/0+$/, '')
  return formatTyping(decimals ? `${int},${decimals}` : int)
}
