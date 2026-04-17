import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { BudgetsPageClient } from './BudgetsPageClient'
import { getCategories } from '@/lib/actions/categories.actions'
import { getBudgets } from '@/lib/actions/budgets.actions'

export default async function BudgetsPage() {
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

  const [categoriesResult, budgetsResult] = await Promise.all([
    getCategories(user.id),
    getBudgets(user.id),
  ])
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const budgets = budgetsResult.success ? (budgetsResult.data ?? []) : []

  return <BudgetsPageClient userId={user.id} categories={categories ?? []} initialBudgets={budgets as any[]} />
}
