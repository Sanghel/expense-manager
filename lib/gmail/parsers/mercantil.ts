import type { ParsedTransaction, ParseInput, Parser } from './types'

export function isMercantilSender(fromHeader: string): boolean {
  return fromHeader.toLowerCase().includes('bancomercantil.com')
}

function parseAmountVES(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '')
  const commaDecimal = /,\d{2}$/.test(cleaned)
  const normalized = commaDecimal
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/[.,]/g, '')
  const num = Number(normalized)
  return Number.isFinite(num) && num > 0 ? num : null
}

function parseDate(raw: string): string | null {
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

interface BlockMatch {
  amount: number
  lastFour: string | null
  merchant: string | null
  date: string
  type: 'expense' | 'income'
}

function parseBlock(block: string, fallbackDate: string): BlockMatch | null {
  const montoM = block.match(/MONTO:\s*BS\.\s*([\d.,]+)/i)
  if (!montoM) return null
  const amount = parseAmountVES(montoM[1])
  if (!amount) return null

  const cuentaM = block.match(/CUENTA\s+DEBITO[^\d]*\*+\s*(\d{4})/i)
  const tarjetaM = block.match(/NUMERO\s+DE\s+TARJETA\s+DE\s+DEBITO[^\d]*\*+\s*(\d{4})/i)
  const lastFour = cuentaM?.[1] ?? tarjetaM?.[1] ?? null

  const merchantM = block.match(/NOMBRE\s+DEL\s+COMERCIO:\s*([^\n\r]+)/i)
  const merchant = merchantM?.[1]?.trim() ?? null

  const fechaM = block.match(/FECHA\s+DE\s+LA\s+OPERACION:\s*([\d/]+)/i)
  const date = (fechaM && parseDate(fechaM[1])) || fallbackDate

  const opM = block.match(/^\s*OPERACION:\s*(\w+)/im)
  const opCode = opM?.[1]?.toUpperCase() ?? 'CONSUMO'
  const type: 'expense' | 'income' = ['ABONO', 'DEPOSITO', 'CREDITO'].includes(opCode) ? 'income' : 'expense'

  return { amount, lastFour, merchant, date, type }
}

export const parseMercantil: Parser = (input: ParseInput): ParsedTransaction[] => {
  const body = [input.subject, input.bodyText, input.bodyHtml].filter(Boolean).join('\n')
  if (!body) return []

  const fallbackDate = input.receivedAt.toISOString().split('T')[0]

  const parts = body.split(/OPERACION\s+\d+/i)
  const blocks = parts.slice(1)
  if (blocks.length === 0) return []

  const results: ParsedTransaction[] = []
  for (const block of blocks) {
    const parsed = parseBlock(block, fallbackDate)
    if (!parsed) continue
    results.push({
      type: parsed.type,
      amount: parsed.amount,
      currency: 'VES',
      lastFour: parsed.lastFour,
      merchant: parsed.merchant,
      date: parsed.date,
      description: parsed.merchant ? `Consumo en ${parsed.merchant}` : 'Operación Mercantil',
      confidence: parsed.lastFour && parsed.merchant ? 0.95 : 0.7,
      matchedRule: 'mercantil:consumo',
      source: 'mercantil',
    })
  }
  return results
}
