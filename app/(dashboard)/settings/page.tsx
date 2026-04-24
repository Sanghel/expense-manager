import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getUserProfile } from '@/lib/actions/users.actions'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { getAccountMovements } from '@/lib/actions/account_movements.actions'
import { getCategories } from '@/lib/actions/categories.actions'
import { SettingsPageClient } from './SettingsPageClient'
import type { User, ExchangeRate, Account, AccountMovementWithAccounts, Category } from '@/types/database.types'

type Tab = 'general' | 'accounts' | 'categorias'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: userRow } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!userRow) {
    redirect('/login')
  }

  const params = await searchParams
  const tab = (params.tab as Tab) || 'general'

  const [profileResult, ratesResult, accountsResult, movementsResult] = await Promise.all([
    getUserProfile(userRow.id),
    getAllRatePairs(),
    getAccounts(userRow.id),
    getAccountMovements(userRow.id),
  ])

  const user = profileResult.success ? (profileResult.data as User) : null
  const rates = (ratesResult.success ? ratesResult.data : []) as ExchangeRate[]
  const accounts = (accountsResult.success ? accountsResult.data : []) as Account[]
  const movements = (movementsResult.success ? movementsResult.data : []) as AccountMovementWithAccounts[]

  if (!user) {
    redirect('/login')
  }

  let initialCategories: Category[] = []
  if (tab === 'categorias') {
    const result = await getCategories(userRow.id)
    initialCategories = result.success ? (result.data ?? []) : []
  }

  return (
    <SettingsPageClient
      userId={userRow.id}
      preferredCurrency={user.preferred_currency}
      initialRates={rates}
      initialAccounts={accounts}
      initialMovements={movements}
      activeTab={tab}
      initialCategories={initialCategories}
    />
  )
}
