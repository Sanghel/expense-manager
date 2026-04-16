export type Currency = 'COP' | 'USD' | 'VES'
export type TransactionType = 'income' | 'expense'
export type BudgetPeriod = 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'conversational'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Whitelist {
  id: string
  email: string
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  preferred_currency: Currency
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null // null = predefined
  name: string
  type: TransactionType
  icon: string | null
  color: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: Currency
  type: TransactionType
  category_id: string
  description: string
  date: string // ISO date
  source: TransactionSource
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  currency: Currency
  period: BudgetPeriod
  start_date: string // ISO date
  created_at: string
}

export interface ExchangeRate {
  id: string
  from_currency: Currency
  to_currency: Currency
  rate: number
  date: string // ISO date
  created_at: string
}

export interface RecurringTransaction {
  id: string
  user_id: string
  amount: number
  currency: Currency
  type: TransactionType
  category_id: string
  description: string
  frequency: RecurrenceFrequency
  start_date: string // ISO date
  end_date: string | null // ISO date
  is_active: boolean
  last_generated: string | null // ISO date
  created_at: string
}

// With relations
export interface TransactionWithCategory extends Transaction {
  category: Category
}

export interface BudgetWithCategory extends Budget {
  category: Category
}

export interface RecurringTransactionWithCategory extends RecurringTransaction {
  category: Category
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: Currency
  deadline: string | null // ISO date
  is_completed: boolean
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface TransactionWithTags extends Transaction {
  category: Category
  tags?: Tag[]
}
