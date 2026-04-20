import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { RecurringTransactionsPageContent } from '@/components/recurring/RecurringTransactionsPageContent'
import { getCategories } from '@/lib/actions/categories.actions'
import { getRecurringTransactions } from '@/lib/actions/recurring.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'

export default async function RecurringTransactionsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user?.id || userError) {
    console.error('User not found or error:', userError)
    redirect('/login')
  }

  const [categoriesResult, transactionsResult, accountsResult] = await Promise.all([
    getCategories(user.id),
    getRecurringTransactions(user.id),
    getAccounts(user.id),
  ])
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const transactions = transactionsResult.success ? (transactionsResult.data ?? []) : []
  const accounts = accountsResult.success ? (accountsResult.data ?? []) : []

  return <RecurringTransactionsPageContent userId={user.id} categories={categories} accounts={accounts} initialTransactions={transactions} />
}
