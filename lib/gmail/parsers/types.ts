// lib/gmail/parsers/types.ts
import type { Currency, TransactionType } from '@/types/database.types'

export type ParserSource = 'bancolombia' | 'binance' | 'mercantil'

export interface ParsedTransaction {
  type: TransactionType
  amount: number
  currency: Currency
  lastFour: string | null
  merchant: string | null
  date: string // ISO YYYY-MM-DD
  description: string
  confidence: number // 0..0.95
  matchedRule: string
  source: ParserSource
}

export interface ParseInput {
  subject: string
  bodyText: string
  bodyHtml: string
  receivedAt: Date
}

export type Parser = (input: ParseInput) => ParsedTransaction[]
