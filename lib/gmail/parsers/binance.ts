import type { ParsedTransaction, ParseInput, Parser } from './types'
import type { Currency } from '@/types/database.types'

export function isBinanceSender(fromHeader: string): boolean {
  return fromHeader.toLowerCase().includes('binance.com')
}

const STABLE_TO_USD: Record<string, Currency> = {
  USDT: 'USD',
  USDC: 'USD',
  BUSD: 'USD',
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/,/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) && num > 0 ? num : null
}

export const parseBinance: Parser = (input: ParseInput): ParsedTransaction[] => {
  const body = `${input.subject ?? ''}\n${input.bodyText ?? ''}\n${input.bodyHtml ?? ''}`
  const amountMatch = body.match(/Amount:\s*([\d.,]+)\s*([A-Z]{3,5})/i)
  if (!amountMatch) return []

  const symbol = amountMatch[2].toUpperCase()
  const currency = STABLE_TO_USD[symbol]
  if (!currency) return []

  const amount = parseAmount(amountMatch[1])
  if (!amount) return []

  const timeMatch = body.match(/Time:\s*(\d{4}-\d{2}-\d{2})/)
  const date = timeMatch ? timeMatch[1] : input.receivedAt.toISOString().split('T')[0]

  return [{
    type: 'expense',
    amount,
    currency,
    lastFour: null,
    merchant: null,
    date,
    description: `Pago Binance ${symbol}`,
    confidence: 0.7,
    matchedRule: 'payment',
    source: 'binance',
  }]
}
