import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforge } from '@/lib/insforge'
import { TransactionsPageClient } from './TransactionsPageClient'
import { getCategories } from '@/lib/actions/categories.actions'

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user } = await insforge.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    redirect('/login')
  }

  const categoriesResult = await getCategories(user.id)
  const categories = categoriesResult.success ? categoriesResult.data : []

  return <TransactionsPageClient userId={user.id} categories={categories ?? []} />
}
