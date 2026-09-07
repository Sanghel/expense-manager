export type Currency = 'COP' | 'USD' | 'VES'
export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'
export type BudgetPeriod = 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'conversational' | 'import' | 'gmail'

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
  card_number: string | null
  is_active: boolean
  is_default: boolean
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

/** What a budget is measured against. */
export type BudgetScope = 'category' | 'group' | 'total'

/** How the budget's limit is expressed. */
export type BudgetAmountType = 'fixed' | 'percent_income' | 'percent_expense'

export interface Budget {
  id: string
  user_id: string
  scope: BudgetScope
  /** Set when scope is 'category'. */
  category_id: string | null
  /** Set when scope is 'group'. */
  group_id: string | null
  amount_type: BudgetAmountType
  /** Set when amount_type is 'fixed'. */
  amount: number | null
  /** 0-100. Set when amount_type is a percentage. */
  percent: number | null
  currency: Currency
  period: BudgetPeriod
  start_date: string // ISO date
  created_at: string
}

export interface CategoryGroup {
  id: string
  user_id: string
  name: string
  icon: string | null
  color: string | null
  created_at: string
}

export interface CategoryGroupWithMembers extends CategoryGroup {
  category_ids: string[]
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

/** A budget with its current cycle resolved and spending aggregated. */
export interface BudgetWithSpent extends Budget {
  category: Category | null
  group: CategoryGroup | null
  spent: number
  /**
   * The limit in the budget's currency for the active cycle. Equals `amount`
   * for fixed budgets; for percentage budgets it is derived from the period's
   * income or expense, so it is recomputed every cycle.
   */
  limit_amount: number
  /** Income and expense of the active cycle, in the budget's currency. */
  periodIncome: number
  periodExpense: number
  periodStart: string
  periodEnd: string
}

export interface SavingsContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  /** Amount credited to the goal, in the GOAL's currency, at contribution time. */
  converted_amount: number
  currency: Currency
  account_id: string | null
  notes: string | null
  created_at: string
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

export type ReminderType = 'income' | 'expense'

export interface Reminder {
  id: string
  user_id: string
  description: string
  type: ReminderType
  category_id: string | null
  account_id: string | null
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

export type AdviceSeverity = 'info' | 'warning' | 'critical'

export interface SavingsInsight {
  title: string
  detail: string
  severity: AdviceSeverity
  category_id?: string | null
}

export interface SavingsBudgetSuggestion {
  category_id: string
  category_name: string
  suggested_amount: number
  rationale: string
  current_budget_amount?: number | null
}

export interface SavingsGoalSuggestion {
  name: string
  target_amount: number
  monthly_contribution?: number | null
  deadline?: string | null
  rationale: string
}

/** A category group the model proposes creating. */
export interface SavingsGroupSuggestion {
  name: string
  category_ids: string[]
  category_names: string[]
  rationale: string
}

export type CategorySuggestionKind = 'merge' | 'rename' | 'categorize' | 'review'

/** How to tidy the categories themselves. */
export interface SavingsCategorySuggestion {
  kind: CategorySuggestionKind
  title: string
  detail: string
  category_ids: string[]
}

export interface AiSavingsAdvice {
  id: string
  user_id: string
  period: string // 'YYYY-MM'
  currency: Currency
  insights: SavingsInsight[]
  budget_suggestions: SavingsBudgetSuggestion[]
  goal_suggestions: SavingsGoalSuggestion[]
  group_suggestions: SavingsGroupSuggestion[]
  category_suggestions: SavingsCategorySuggestion[]
  generated_at: string
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
