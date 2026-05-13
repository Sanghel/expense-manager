import type { CreateTransactionInput } from '@/lib/validations/transaction'

export type ParsedImportRow = {
  rowIndex: number // 1-based, for user-facing error messages
  raw: Record<string, unknown>
}

export type ResolvedImportRow = {
  rowIndex: number
  status: 'valid' | 'error'
  errors: string[]
  data?: CreateTransactionInput // only present when status === 'valid'
  displayData: {
    amount: number | string
    currency: string
    type: string
    category: string
    account: string
    description: string
    date: string
    notes?: string
  }
}
