import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { ReportsContent } from '@/components/ReportsContent'

export default async function ReportsPage() {
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

  // The preferred currency now comes from getReportDataset, alongside the data
  // it converts, so it can never disagree with the figures on screen.
  return <ReportsContent userId={user.id} />
}
