'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import type { Currency, User } from '@/types/database.types'

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
