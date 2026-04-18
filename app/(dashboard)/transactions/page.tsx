import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { TransactionsPageClient } from './TransactionsPageClient'
import { getCategories } from '@/lib/actions/categories.actions'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import type { TransactionWithCategory, Account } from '@/types/database.types'

export default async function TransactionsPage() {
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

  const [categoriesResult, transactionsResult, accountsResult] = await Promise.all([
    getCategories(user.id),
    getTransactions(user.id, 500),
    getAccounts(user.id),
  ])
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const transactions = transactionsResult.success ? ((transactionsResult.data ?? []) as TransactionWithCategory[]) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]

  return <TransactionsPageClient userId={user.id} categories={categories ?? []} initialTransactions={transactions} accounts={accounts} />
}
