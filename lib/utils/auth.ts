import { cache } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'
import type { User } from '@/types/database.types'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentDbUser()
  return user?.id ?? null
}

/**
 * The signed-in user's row, or null without a session. Wrapped in React
 * `cache()` so the dashboard layout and the page share a single query per
 * request instead of each looking the user up by email.
 */
export const getCurrentDbUser = cache(async (): Promise<User | null> => {
  const sessionUser = await getCurrentUser()
  if (!sessionUser?.email) return null

  const { data } = await insforgeAdmin.database
    .from('users')
    .select('*')
    .eq('email', sessionUser.email)
    .maybeSingle()

  return (data as User | null) ?? null
})
