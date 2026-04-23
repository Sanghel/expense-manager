import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getLoans } from '@/lib/actions/loans.actions'
import { getAccounts } from '@/lib/actions/accounts.actions'
import { LoansPageClient } from './LoansPageClient'

export default async function LoansPage() {
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
    redirect('/login')
  }

  const [loansResult, accountsResult] = await Promise.all([
    getLoans(user.id),
    getAccounts(user.id),
  ])

  return (
    <LoansPageClient
      userId={user.id}
      initialLoans={loansResult.success && loansResult.data ? loansResult.data : []}
      accounts={accountsResult.success && accountsResult.data ? accountsResult.data : []}
    />
  )
}
