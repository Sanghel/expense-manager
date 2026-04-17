import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { SavingsGoalsPageContent } from '@/components/savings/SavingsGoalsPageContent'
import { getSavingsGoals } from '@/lib/actions/savings.actions'

export default async function SavingsGoalsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user?.id || userError) {
    console.error('User not found or error:', userError)
    redirect('/login')
  }

  const goalsResult = await getSavingsGoals(user.id)
  const goals = goalsResult.success ? (goalsResult.data ?? []) : []

  return <SavingsGoalsPageContent userId={user.id} initialGoals={goals} />
}
