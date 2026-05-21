export type Currency = 'COP' | 'USD' | 'VES'
export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'
export type BudgetPeriod = 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'conversational' | 'import' | 'gmail'
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
  gmail_refresh_token: string | null
  gmail_connected_at: string | null
  gmail_last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null // null = predefined
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  created_at: string
}

export type AccountType = 'bank' | 'digital' | 'crypto' | 'cash' | 'card'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: Currency
  balance: number
  credit_limit: number | null
  color: string | null
  icon: string | null
  last_four: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountMovement {
  id: string
  user_id: string
  from_account_id: string
  from_amount: number
  from_currency: Currency
  to_account_id: string
  to_amount: number
  to_currency: Currency
  description: string | null
  date: string
  created_at: string
}

export interface AccountMovementWithAccounts extends AccountMovement {
  from_account: Account
  to_account: Account
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: Currency
  type: TransactionType
  category_id: string | null
  account_id: string | null
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
  account_id: string | null
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

export type LoanType = 'lent' | 'borrowed'
export type LoanStatus = 'active' | 'settled'

export interface Loan {
  id: string
  user_id: string
  person_name: string
  amount: number
  paid_amount: number
  currency: Currency
  account_id: string | null
  type: LoanType
  status: LoanStatus
  notes: string | null
  created_at: string
  updated_at: string
  settled_at: string | null
}

export interface LoanWithAccount extends Loan {
  account: Pick<Account, 'id' | 'name' | 'currency' | 'icon'> | null
}

export interface LoanPayment {
  id: string
  loan_id: string
  user_id: string
  amount: number
  currency: Currency
  date: string
  notes: string | null
  created_at: string
}

export type ReminderFrequency = 'once' | 'weekly' | 'monthly' | 'yearly'

export interface Reminder {
  id: string
  user_id: string
  description: string
  category_id: string | null
  frequency: ReminderFrequency
  day_of_week: number | null
  day_of_month: number | null
  month_of_year: number | null
  specific_date: string | null
  is_active: boolean
  created_at: string
}

export interface ReminderWithCategory extends Reminder {
  category: Category | null
}

export type ProcessedEmailOutcome =
  | 'auto_registered'
  | 'skipped'
  | 'error'

export interface ProcessedEmail {
  gmail_message_id: string
  user_id: string
  outcome: ProcessedEmailOutcome
  transaction_id: string | null
  error_message: string | null
  processed_at: string
}
