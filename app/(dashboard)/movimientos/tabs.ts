import type {
  BudgetWithSpent,
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
  budgets: BudgetWithSpent[]
}

export interface RecordatoriosData {
  reminders: ReminderWithCategory[]
  todaysTransactions: { description: string; category_id: string | null }[]
}

export type PrestamosData = LoanWithAccount[]
