import type { Currency, TransactionType } from '@/types/database.types'

export interface ParsedBancolombiaTx {
  type: TransactionType
  amount: number
  currency: Currency
  lastFour: string | null
  merchant: string | null
  date: string // ISO date (YYYY-MM-DD)
  description: string
  confidence: number
  matchedRule: string
}

export interface ParseInput {
  subject: string
  bodyText: string
  bodyHtml: string
  receivedAt: Date // fallback when the email body has no explicit date
}

const BANCOLOMBIA_SENDERS = [
  'notificacionesbancolombia@bancolombia.com.co',
  'alertasynotificaciones@notificacionesbancolombia.com',
  'alertasynotificaciones@bancolombia.com.co',
]

export function isBancolombiaSender(fromHeader: string): boolean {
  const lower = fromHeader.toLowerCase()
  return BANCOLOMBIA_SENDERS.some((s) => lower.includes(s))
}

/**
 * Bancolombia montos vienen como "$1.234.567,89" (COP) o "$1,234.56" (USD).
 * COP usa punto como separador de miles y coma decimal; USD lo contrario.
 * Heurística: si hay coma y luego 2 dígitos al final ⇒ decimal coma (COP).
 *             si hay punto y luego 2 dígitos al final ⇒ decimal punto (USD).
 *             solo separadores de miles ⇒ entero.
 */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/^\$/, '')
  if (!cleaned) return null

  const commaDecimal = /,\d{2}$/.test(cleaned)
  const dotDecimal = /\.\d{2}$/.test(cleaned)

  let normalized: string
  if (commaDecimal) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (dotDecimal && cleaned.split('.').length === 2) {
    normalized = cleaned.replace(/,/g, '')
  } else {
    normalized = cleaned.replace(/[.,]/g, '')
  }

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
  // Bancolombia rara vez envía USD/VES en estos correos; default COP.
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
  // Compra con tarjeta: "Bancolombia te informa Compra por $X en COMERCIO ... T.Cred *NNNN"
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
  // Transferencia enviada: "Transferiste $X a NOMBRE desde cta *NNNN"
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
  // Pago PSE / servicios: "Realizaste un pago por $X a EMPRESA"
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
  // Recepción / consignación: "Recibiste una transferencia por $X de NOMBRE en cuenta *NNNN"
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

export function parseBancolombia(input: ParseInput): ParsedBancolombiaTx | null {
  const subject = (input.subject ?? '').replace(/\s+/g, ' ').trim()
  const bodyFromText = (input.bodyText ?? '').replace(/\s+/g, ' ').trim()
  const bodyFromHtml = input.bodyHtml ? htmlToText(input.bodyHtml) : ''
  const haystack = [subject, bodyFromText, bodyFromHtml].filter(Boolean).join(' \n ')

  if (!haystack) return null

  for (const rule of RULES) {
    const match = haystack.match(rule.pattern)
    if (!match) continue

    const result = rule.build(match)
    const amount = parseAmount(result.amountRaw)
    if (!amount) continue

    const currency = detectCurrency(haystack)
    const date = todayIsoFrom(input.receivedAt)

    // Confianza: monto + tipo + merchant + last_four ⇒ 0.95
    // sin last_four ⇒ 0.6 (queda en drafts hasta que usuario asigne cuenta)
    let confidence = 0.6
    if (result.lastFour) confidence += 0.3
    if (result.merchant && result.merchant.length >= 3) confidence += 0.05
    confidence = Math.min(confidence, 0.95)

    return {
      type: result.type,
      amount,
      currency,
      lastFour: result.lastFour,
      merchant: result.merchant,
      date,
      description: result.description,
      confidence,
      matchedRule: result.matchedRule,
    }
  }

  return null
}
