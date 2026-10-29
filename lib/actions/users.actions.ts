'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import type { Currency, ThemePreference, User } from '@/types/database.types'

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await insforgeAdmin.database
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { success: true, data: data as User }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch user profile' }
  }
}

export async function updatePreferredCurrency(userId: string, currency: Currency) {
  try {
    const { error } = await insforgeAdmin.database
      .from('users')
      .update({ preferred_currency: currency })
      .eq('id', userId)

    if (error) throw error
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to update preferred currency' }
  }
}

export async function updateTheme(userId: string, theme: ThemePreference) {
  try {
    const { error } = await insforgeAdmin.database
      .from('users')
      .update({ theme })
      .eq('id', userId)

    if (error) throw error
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to update theme' }
  }
}

/**
 * Returns the saved theme, or null if it can't be read (for example before the
 * `users.theme` migration is applied), so callers fall back to the default.
 */
export async function getTheme(userId: string): Promise<ThemePreference | null> {
  const { data, error } = await insforgeAdmin.database
    .from('users')
    .select('theme')
    .eq('id', userId)
    .single()

  if (error || (data?.theme !== 'dark' && data?.theme !== 'light')) return null
  return data.theme
}
