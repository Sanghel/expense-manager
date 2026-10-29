import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached } from '@/lib/data/cached'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import type { TransactionWithCategory, Currency, Account, ExchangeRate, BudgetWithSpent } from '@/types/database.types'

export default async function DashboardPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  const [transactionsResult, ratesResult, accountsResult, budgetsResult] = await Promise.all([
    getTransactions(user.id, 500),
    getAllRatePairs(),
    getAccountsCached(user.id),
    getBudgets(user.id),
  ])

  const preferredCurrency = user.preferred_currency ?? 'COP'
  const transactions = transactionsResult.success ? (transactionsResult.data ?? []) : []
  const exchangeRates = ratesResult.success ? (ratesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]
  const budgets = (budgetsResult.success ? (budgetsResult.data ?? []) : []) as BudgetWithSpent[]

  return (
    <DashboardContent
      userId={user.id}
      initialTransactions={transactions as TransactionWithCategory[]}
      initialPreferredCurrency={preferredCurrency as Currency}
      initialExchangeRates={exchangeRates as ExchangeRate[]}
      initialAccounts={accounts}
      budgets={budgets}
    />
  )
}
