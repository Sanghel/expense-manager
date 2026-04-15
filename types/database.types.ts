export type Currency = 'COP' | 'USD' | 'BOB'
export type TransactionType = 'income' | 'expense'
export type BudgetPeriod = 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'conversational'

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

// With relations
export interface TransactionWithCategory extends Transaction {
  category: Category
}

export interface BudgetWithCategory extends Budget {
  category: Category
}
