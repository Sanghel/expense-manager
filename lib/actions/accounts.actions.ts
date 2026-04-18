'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/lib/validations/account'

export async function getAccounts(userId: string) {
  if (!userId) return { success: false, error: 'User ID is required' }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('Get accounts error:', error)
    return { success: false, error: 'Failed to fetch accounts' }
  }
}

export async function createAccount(userId: string, data: CreateAccountInput) {
  try {
    const validated = createAccountSchema.parse(data)

    const { data: account, error } = await insforgeAdmin.database
      .from('accounts')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true, data: account }
  } catch (error) {
    console.error('Create account error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

export async function updateAccount(id: string, userId: string, data: UpdateAccountInput) {
  try {
    const validated = updateAccountSchema.parse(data)

    const { data: account, error } = await insforgeAdmin.database
      .from('accounts')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true, data: account }
  } catch (error) {
    console.error('Update account error:', error)
    return { success: false, error: 'Failed to update account' }
  }
}

export async function deleteAccount(id: string, userId: string) {
  try {
    const { data: movements } = await insforgeAdmin.database
      .from('account_movements')
      .select('id')
      .or(`from_account_id.eq.${id},to_account_id.eq.${id}`)
      .limit(1)

    if (movements && movements.length > 0) {
      return { success: false, error: 'No se puede eliminar: la cuenta tiene movimientos asociados' }
    }

    const { error } = await insforgeAdmin.database
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete account error:', error)
    return { success: false, error: 'Failed to delete account' }
  }
}
