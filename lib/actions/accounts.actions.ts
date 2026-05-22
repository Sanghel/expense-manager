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

async function clearOtherDefaults(userId: string, exceptId: string | null) {
  const query = insforgeAdmin.database
    .from('accounts')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true)
  if (exceptId) await query.neq('id', exceptId)
  else await query
}

export async function createAccount(userId: string, data: CreateAccountInput) {
  try {
    const validated = createAccountSchema.parse(data)

    // For card accounts, balance starts equal to credit_limit (available credit)
    if (validated.type === 'card' && validated.credit_limit != null) {
      validated.balance = validated.credit_limit
    }

    // If the user has no accounts yet, auto-mark this one as default.
    const { count } = await insforgeAdmin.database
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
    const isFirstAccount = (count ?? 0) === 0

    if (validated.is_default) {
      await clearOtherDefaults(userId, null)
    }

    const payload = {
      ...validated,
      is_default: validated.is_default ?? isFirstAccount,
      user_id: userId,
    }

    const { data: account, error } = await insforgeAdmin.database
      .from('accounts')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/movimientos')
    return { success: true, data: account }
  } catch (error) {
    console.error('Create account error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

export async function updateAccount(id: string, userId: string, data: UpdateAccountInput) {
  try {
    const validated = updateAccountSchema.parse(data)

    if (validated.is_default === true) {
      await clearOtherDefaults(userId, id)
    }

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
    revalidatePath('/movimientos')
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
