import { getCurrentDbUser } from '@/lib/utils/auth'
import { getAccountsCached, getCategoriesCached } from '@/lib/data/cached'
import { getReminderNotifications } from '@/lib/actions/reminders.actions'
// import { runDailyCatchUp } from '@/lib/utils/dailyCatchUp'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FloatingChat } from '@/components/chat/FloatingChat'
import { ThemeSync } from '@/components/providers/ThemeSync'
import type { ReminderOccurrence } from '@/lib/reminders/pending'
import type { ThemePreference } from '@/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentDbUser()

  let categories: Awaited<ReturnType<typeof getCategoriesCached>>['data'] = []
  let accounts: Awaited<ReturnType<typeof getAccountsCached>>['data'] = []
  let notifications: ReminderOccurrence[] = []
  // `users.theme` may not exist yet (migration pending), hence the check.
  const theme: ThemePreference | null =
    user?.theme === 'dark' || user?.theme === 'light' ? user.theme : null

  if (user) {
    const [categoriesResult, accountsResult, notificationsResult] = await Promise.all([
      getCategoriesCached(user.id),
      getAccountsCached(user.id),
      getReminderNotifications(user.id),
      // runDailyCatchUp(),
    ])
    categories = categoriesResult.success ? categoriesResult.data : []
    accounts = accountsResult.success ? accountsResult.data : []
    notifications = notificationsResult.success
      ? ((notificationsResult.data ?? []) as ReminderOccurrence[])
      : []
  }

  return (
    <>
      <ThemeSync theme={theme} />
      <DashboardShell
        userId={user?.id ?? null}
        accounts={accounts ?? []}
        notifications={notifications}
      >
        {children}
      </DashboardShell>
      {user && (
        <FloatingChat userId={user.id} categories={categories ?? []} accounts={accounts ?? []} />
      )}
    </>
  )
}
