'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createAccountMovementSchema,
  type CreateAccountMovementInput,
} from '@/lib/validations/account'

export async function getAccountMovements(userId: string) {
  if (!userId) return { success: false, error: 'User ID is required' }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('account_movements')
      .select('*, from_account:accounts!from_account_id(*), to_account:accounts!to_account_id(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data ?? [] }
  } catch (error) {
    console.error('Get account movements error:', error)
    return { success: false, error: 'Failed to fetch account movements' }
  }
}

export async function createAccountMovement(userId: string, data: CreateAccountMovementInput) {
  try {
    const validated = createAccountMovementSchema.parse(data)

    if (validated.from_account_id === validated.to_account_id) {
      return { success: false, error: 'La cuenta origen y destino no pueden ser la misma' }
    }

    const { data: movement, error } = await insforgeAdmin.database
      .from('account_movements')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error

    // Actualizar balances
    await Promise.all([
      insforgeAdmin.database.rpc('decrement_account_balance', {
        account_id: validated.from_account_id,
        amount: validated.amount,
      }),
      insforgeAdmin.database.rpc('increment_account_balance', {
        account_id: validated.to_account_id,
        amount: validated.amount,
      }),
    ])

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true, data: movement }
  } catch (error) {
    console.error('Create account movement error:', error)
    return { success: false, error: 'Failed to create account movement' }
  }
}

export async function deleteAccountMovement(id: string, userId: string) {
  try {
    const { data: movement, error: fetchError } = await insforgeAdmin.database
      .from('account_movements')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !movement) {
      return { success: false, error: 'Movimiento no encontrado' }
    }

    const { error } = await insforgeAdmin.database
      .from('account_movements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    // Revertir balances
    await Promise.all([
      insforgeAdmin.database.rpc('increment_account_balance', {
        account_id: movement.from_account_id,
        amount: movement.amount,
      }),
      insforgeAdmin.database.rpc('decrement_account_balance', {
        account_id: movement.to_account_id,
        amount: movement.amount,
      }),
    ])

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete account movement error:', error)
    return { success: false, error: 'Failed to delete account movement' }
  }
}
