import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user?.email) return null

  const { data } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  return (data as { id: string } | null)?.id ?? null
}
