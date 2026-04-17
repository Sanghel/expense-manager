import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'
import { getUserProfile } from '@/lib/actions/users.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import type { TransactionWithCategory, Currency } from '@/types/database.types'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    redirect('/login')
  }

  const [profileResult, transactionsResult, budgetsResult, ratesResult] = await Promise.all([
    getUserProfile(user.id),
    getTransactions(user.id, 500),
    getBudgets(user.id),
    getAllRatePairs(),
  ])

  const preferredCurrency = profileResult.success ? (profileResult.data?.preferred_currency ?? 'COP') : 'COP'
  const transactions = transactionsResult.success ? (transactionsResult.data ?? []) : []
  const budgets = budgetsResult.success ? (budgetsResult.data ?? []) : []
  const exchangeRates = ratesResult.success ? (ratesResult.data ?? []) : []

  return (
    <DashboardContent
      userId={user.id}
      initialTransactions={transactions as TransactionWithCategory[]}
      initialBudgets={budgets as any[]}
      initialPreferredCurrency={preferredCurrency as Currency}
      initialExchangeRates={exchangeRates as any[]}
    />
  )
}
