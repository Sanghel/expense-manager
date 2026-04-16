import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { CategoriesPageClient } from './CategoriesPageClient'
import type { Category } from '@/types/database.types'

export default async function CategoriesPage() {
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
  const categories = (categoriesResult.success ? categoriesResult.data : []) as Category[]

  return <CategoriesPageClient userId={user.id} initialCategories={categories} />
}
