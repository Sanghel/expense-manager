import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { BudgetsPageClient } from './BudgetsPageClient'
import { getCategories } from '@/lib/actions/categories.actions'

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

  const categoriesResult = await getCategories(user.id)
  const categories = categoriesResult.success ? categoriesResult.data : []

  return <BudgetsPageClient userId={user.id} categories={categories ?? []} />
}
