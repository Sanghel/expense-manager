import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { CalendarPageContent } from '@/components/calendar/CalendarPageContent'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import type { TransactionWithCategory, Account } from '@/types/database.types'

export default async function CalendarPage() {
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

  const [transactionsResult, categoriesResult, accountsResult] = await Promise.all([
    getTransactions(user.id, 1000),
    getCategories(user.id),
    getAccounts(user.id),
  ])

  const transactions: TransactionWithCategory[] = transactionsResult.success ? (transactionsResult.data ?? []) : []
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]

  return (
    <CalendarPageContent
      userId={user.id}
      initialTransactions={transactions}
      categories={categories}
      accounts={accounts}
    />
  )
}
