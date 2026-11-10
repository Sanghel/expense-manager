import type { OccurrenceTransaction } from '@/lib/reminders/pending'
import type {
  LoanWithAccount,
  ReminderWithCategory,
  TransactionWithCategory,
} from '@/types/database.types'

export type MovimientosTab = 'transacciones' | 'prestamos' | 'recordatorios'

export function parseMovimientosTab(raw: string | null | undefined): MovimientosTab {
  return raw === 'prestamos' || raw === 'recordatorios' ? raw : 'transacciones'
}

export interface TransaccionesData {
  transactions: TransactionWithCategory[]
}

export interface RecordatoriosData {
  reminders: ReminderWithCategory[]
  /** Transactions around today, to tell which reminder occurrences are paid. */
  recentTransactions: OccurrenceTransaction[]
}

export type PrestamosData = LoanWithAccount[]
