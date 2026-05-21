import type { ParsedTransaction, ParseInput, Parser } from './types'
import type { Currency, TransactionType } from '@/types/database.types'

const BANCOLOMBIA_SENDERS = [
  'notificacionesbancolombia@bancolombia.com.co',
  'alertasynotificaciones@notificacionesbancolombia.com',
  'alertasynotificaciones@bancolombia.com.co',
  'alertasynotificaciones@an.notificacionesbancolombia.com',
]

export function isBancolombiaSender(fromHeader: string): boolean {
  const lower = fromHeader.toLowerCase()
  return BANCOLOMBIA_SENDERS.some((s) => lower.includes(s))
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/^\$/, '')
  if (!cleaned) return null
  const commaDecimal = /,\d{2}$/.test(cleaned)
  const dotDecimal = /\.\d{2}$/.test(cleaned)
  let normalized: string
  if (commaDecimal) normalized = cleaned.replace(/\./g, '').replace(',', '.')
  else if (dotDecimal && cleaned.split('.').length === 2) normalized = cleaned.replace(/,/g, '')
  else normalized = cleaned.replace(/[.,]/g, '')
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0 ? num : null
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectCurrency(text: string): Currency {
  if (/\bUSD\b|US\$/i.test(text)) return 'USD'
  return 'COP'
}

function todayIsoFrom(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface RuleResult {
  type: TransactionType
  amountRaw: string
  merchant: string | null
  lastFour: string | null
  description: string
  matchedRule: string
}

const RULES: Array<{
  name: string
  pattern: RegExp
  build: (m: RegExpMatchArray) => RuleResult
}> = [
  {
    name: 'compra_tarjeta_v2',
    pattern:
      /compraste\s+\$?\s*([\d.,]+)\s+en\s+([A-Z0-9 .,&'\-/]+?)\s+con\s+tu\s+t\.?\s*(?:deb|cred)\s*\*?(\d{4})/i,
    build: (m) => ({
      type: 'expense',
      amountRaw: m[1],
      merchant: m[2].trim().replace(/\s+/g, ' '),
      lastFour: m[3],
      description: `Compra en ${m[2].trim().replace(/\s+/g, ' ')}`,
      matchedRule: 'compra_tarjeta_v2',
    }),
  },
  {
    name: 'transferencia_a_cuenta',
    pattern:
      /transferiste\s+\$?\s*([\d.,]+)\s+desde\s+(?:tu\s+)?cuenta\s+\*?(\d{4,})\s+a\s+(?:la\s+)?cuenta\s+\*?(\d+)/i,
    build: (m) => {
      const lastFour = m[2].slice(-4)
      const destAccount = `*${m[3].slice(-4)}`
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant: destAccount,
        lastFour,
        description: `Transferencia a cuenta ${destAccount}`,
        matchedRule: 'transferencia_a_cuenta',
      }
    },
  },
  {
    name: 'compra_tarjeta',
    pattern:
      /compra(?:ste)?\s+por\s+\$?\s*([\d.,]+)\s+(?:con\s+tarjeta\s+)?(?:de\s+cr[eé]dito|de\s+d[eé]bito|t\.?\s*(?:cred|deb))?[^.]*?en\s+([A-Z0-9 .,&'\-/*]+?)(?:\s+el\s|\s+\.|\.|\s+t\.?\s*(?:cred|deb)\b|\s+tarjeta\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/\*+\s*(\d{4})\b|tarjeta[^\d]{0,15}(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const merchant = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant,
        lastFour,
        description: `Compra en ${merchant}`,
        matchedRule: 'compra_tarjeta',
      }
    },
  },
  {
    name: 'transferencia_enviada',
    pattern:
      /transfer(?:iste|encia)\s+(?:exitosa\s+de\s+)?\$?\s*([\d.,]+)\s+(?:a|para)\s+([A-Z0-9 .,&'\-/]+?)(?:\s+desde|\s+de\s+(?:tu\s+)?cuenta|\s+el\b|\.|\sa\s+las\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/cuenta[^\d]{0,20}(\d{4})\b|cta[^\d]{0,10}\*?(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const merchant = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant,
        lastFour,
        description: `Transferencia a ${merchant}`,
        matchedRule: 'transferencia_enviada',
      }
    },
  },
  {
    name: 'pago_servicio',
    pattern:
      /(?:realizaste\s+un\s+)?pago\s+(?:por|de)\s+\$?\s*([\d.,]+)\s+(?:a|para)\s+([A-Z0-9 .,&'\-/]+?)(?:\s+desde|\s+con|\.|\sa\s+las\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/cuenta[^\d]{0,20}(\d{4})\b|tarjeta[^\d]{0,15}(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const merchant = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'expense',
        amountRaw: m[1],
        merchant,
        lastFour,
        description: `Pago a ${merchant}`,
        matchedRule: 'pago_servicio',
      }
    },
  },
  {
    name: 'recepcion',
    pattern:
      /recib(?:iste|ido)\s+(?:una\s+)?(?:transferencia|consignaci[oó]n|abono)\s+(?:por|de)\s+\$?\s*([\d.,]+)\s+de\s+([A-Z0-9 .,&'\-/]+?)(?:\s+en\b|\s+a\b|\.|\sa\s+las\b)/i,
    build: (m) => {
      const lastFourMatch = m.input?.match(/cuenta[^\d]{0,20}(\d{4})\b|cta[^\d]{0,10}\*?(\d{4})\b/i)
      const lastFour = lastFourMatch?.[1] ?? lastFourMatch?.[2] ?? null
      const sender = m[2].trim().replace(/\s+/g, ' ')
      return {
        type: 'income',
        amountRaw: m[1],
        merchant: sender,
        lastFour,
        description: `Transferencia recibida de ${sender}`,
        matchedRule: 'recepcion',
      }
    },
  },
]

export const parseBancolombia: Parser = (input: ParseInput): ParsedTransaction[] => {
  const subject = (input.subject ?? '').replace(/\s+/g, ' ').trim()
  const bodyFromText = (input.bodyText ?? '').replace(/\s+/g, ' ').trim()
  const bodyFromHtml = input.bodyHtml ? htmlToText(input.bodyHtml) : ''
  const haystack = [subject, bodyFromText, bodyFromHtml].filter(Boolean).join(' \n ')
  if (!haystack) return []

  for (const rule of RULES) {
    const match = haystack.match(rule.pattern)
    if (!match) continue
    const result = rule.build(match)
    const amount = parseAmount(result.amountRaw)
    if (!amount) continue
    const currency = detectCurrency(haystack)
    const date = todayIsoFrom(input.receivedAt)
    let confidence = 0.6
    if (result.lastFour) confidence += 0.3
    if (result.merchant && result.merchant.length >= 3) confidence += 0.05
    confidence = Math.min(confidence, 0.95)
    return [{
      type: result.type,
      amount,
      currency,
      lastFour: result.lastFour,
      merchant: result.merchant,
      date,
      description: result.description,
      confidence,
      matchedRule: result.matchedRule,
      source: 'bancolombia',
    }]
  }

  return []
}
