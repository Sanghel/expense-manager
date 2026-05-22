import type { ParsedTransaction, ParseInput, Parser } from './types'

// Bank of America Zelle alert emails arrive from
// reply-<token>@ealerts.bankofamerica.com — the local-part rotates per
// message, but the domain stays the same. Match by domain.
export function isBofaSender(fromHeader: string): boolean {
  const lower = fromHeader.toLowerCase()
  return lower.includes('@ealerts.bankofamerica.com') || lower.includes('@bankofamerica.com')
}

function parseAmount(raw: string): number | null {
  // BofA renders amounts in en-US: "1,234.56". Strip thousands commas.
  const cleaned = raw.replace(/,/g, '').trim()
  const num = Number(cleaned)
  return Number.isFinite(num) && num > 0 ? num : null
}

export const parseBofa: Parser = (input: ParseInput): ParsedTransaction[] => {
  const body = `${input.subject ?? ''}\n${input.bodyText ?? ''}\n${input.bodyHtml ?? ''}`

  // Spanish template: "<Nombre> le envió $22.16"
  // English template (defensive): "<Name> sent you $22.16"
  // Anchor at line boundary so we don't sweep "Bank of America." into the name.
  const patterns = [
    /(?:^|\n)\s*([\p{Lu}][\p{L}\s'-]+?)\s+le\s+envió\s+\$([0-9][\d,]*\.?\d*)/u,
    /(?:^|\n)\s*([\p{Lu}][\p{L}\s'-]+?)\s+sent\s+you\s+\$([0-9][\d,]*\.?\d*)/u,
  ]

  for (const re of patterns) {
    const match = body.match(re)
    if (!match) continue
    const merchantRaw = match[1].trim().replace(/\s+/g, ' ')
    const amount = parseAmount(match[2])
    if (!amount) continue

    const date = input.receivedAt.toISOString().split('T')[0]

    return [{
      type: 'income',
      amount,
      currency: 'USD',
      lastFour: null,
      merchant: merchantRaw,
      date,
      description: `Zelle de ${merchantRaw}`,
      confidence: 0.9,
      matchedRule: 'zelle_received',
      source: 'bofa',
    }]
  }

  return []
}
