import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { getReminderNotifications } from '@/lib/actions/reminders.actions'
// import { runDailyCatchUp } from '@/lib/utils/dailyCatchUp'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FloatingChat } from '@/components/chat/FloatingChat'
import type { ReminderOccurrence } from '@/lib/reminders/pending'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  let userId: string | null = null
  let categories: Awaited<ReturnType<typeof getCategories>>['data'] = []
  let accounts: Awaited<ReturnType<typeof getAccounts>>['data'] = []
  let notifications: ReminderOccurrence[] = []

  if (session?.user?.email) {
    const { data: user } = await insforgeAdmin.database
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (user) {
      userId = user.id
      const [categoriesResult, accountsResult, notificationsResult] = await Promise.all([
        getCategories(user.id),
        getAccounts(user.id),
        getReminderNotifications(user.id),
        // runDailyCatchUp(),
      ])
      categories = categoriesResult.success ? categoriesResult.data : []
      accounts = accountsResult.success ? accountsResult.data : []
      notifications = notificationsResult.success
        ? ((notificationsResult.data ?? []) as ReminderOccurrence[])
        : []
    }
  }

  return (
    <>
      <DashboardShell
        userId={userId}
        accounts={accounts ?? []}
        notifications={notifications}
      >
        {children}
      </DashboardShell>
      {userId && (
        <FloatingChat userId={userId} categories={categories ?? []} accounts={accounts ?? []} />
      )}
    </>
  )
}
