import { redirect } from 'next/navigation'
import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { getAccountMovements } from '@/lib/actions/account_movements.actions'
import { getCategoryGroups } from '@/lib/actions/categoryGroups.actions'
import { SettingsPageClient } from './SettingsPageClient'
import type { CategoriasData, CuentasData } from './tabs'
import type { Account, AccountMovementWithAccounts, ExchangeRate } from '@/types/database.types'

export default async function SettingsPage() {
  const user = await getCurrentDbUser()
  if (!user) {
    redirect('/login')
  }

  // Cuentas and Categorías stream to the client as promises; `?tab=` is read
  // on the client, so switching tabs never waits for the server.
  const cuentas: Promise<CuentasData> = Promise.all([
    getAccountsCached(user.id),
    getAccountMovements(user.id),
  ]).then(([accountsResult, movementsResult]) => ({
    accounts: (accountsResult.success ? accountsResult.data : []) as Account[],
    movements: (movementsResult.success ? movementsResult.data : []) as AccountMovementWithAccounts[],
  }))

  const categorias: Promise<CategoriasData> = Promise.all([
    getCategoriesCached(user.id),
    getCategoryGroups(user.id),
  ]).then(([categoriesResult, groupsResult]) => ({
    categories: categoriesResult.success ? (categoriesResult.data ?? []) : [],
    groups: groupsResult.success ? (groupsResult.data ?? []) : [],
  }))

  // Categories and accounts are the cached copies the layout already loaded;
  // the Gmail sync dialog needs them.
  const [ratesResult, categoriesResult, accountsResult] = await Promise.all([
    getAllRatePairs(),
    getCategoriesCached(user.id),
    getAccountsCached(user.id),
  ])
  const rates = (ratesResult.success ? ratesResult.data : []) as ExchangeRate[]

  const gmailStatus = {
    enabled: user.gmail_sync_enabled === true,
    connected: !!user.gmail_refresh_token,
    connectedAt: user.gmail_connected_at,
    lastSyncedAt: user.gmail_last_synced_at,
  }

  return (
    <SettingsPageClient
      userId={user.id}
      preferredCurrency={user.preferred_currency}
      initialRates={rates}
      categories={categoriesResult.success ? (categoriesResult.data ?? []) : []}
      accounts={(accountsResult.success ? accountsResult.data : []) as Account[]}
      cuentas={cuentas}
      categorias={categorias}
      gmailStatus={gmailStatus}
    />
  )
}
