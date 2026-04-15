import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforge } from '@/lib/insforge'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user?.email) return null

  const { data } = await insforge
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  return data?.id ?? null
}
