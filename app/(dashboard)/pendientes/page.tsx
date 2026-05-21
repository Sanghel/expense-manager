import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { PendientesPageClient } from './PendientesPageClient'
import type {
  Account,
  Category,
  TransactionDraft,
} from '@/types/database.types'

export default async function PendientesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const { data: user } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user?.id) redirect('/login')

  const [categoriesResult, accountsResult, draftsResult] = await Promise.all([
    getCategories(user.id),
    getAccounts(user.id),
    insforgeAdmin.database
      .from('transaction_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]
  const drafts = (draftsResult.data ?? []) as TransactionDraft[]

  return (
    <PendientesPageClient
      userId={user.id}
      initialDrafts={drafts}
      categories={categories as Category[]}
      accounts={accounts}
    />
  )
}
