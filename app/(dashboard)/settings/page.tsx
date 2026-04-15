import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getUserProfile } from '@/lib/actions/users.actions'
import { getAllRatePairs, seedInitialRates } from '@/lib/actions/exchangeRates.actions'
import { SettingsPageClient } from './SettingsPageClient'
import type { User, ExchangeRate } from '@/types/database.types'

export default async function SettingsPage() {
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

  // Seed initial rates if table is empty
  await seedInitialRates()

  const [profileResult, ratesResult] = await Promise.all([
    getUserProfile(userRow.id),
    getAllRatePairs(),
  ])

  const user = profileResult.success ? (profileResult.data as User) : null
  const rates = (ratesResult.success ? ratesResult.data : []) as ExchangeRate[]

  if (!user) {
    redirect('/login')
  }

  return (
    <SettingsPageClient
      userId={userRow.id}
      preferredCurrency={user.preferred_currency}
      initialRates={rates}
    />
  )
}
