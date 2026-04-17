'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '@/lib/validations/transaction'

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput
) {
  try {
    const validated = createTransactionSchema.parse(data)

    const { data: transaction, error } = await insforgeAdmin.database
      .from('transactions')
      .insert([{ ...validated, user_id: userId, source: 'manual' }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Create transaction error:', error)
    return { success: false, error: 'Failed to create transaction' }
  }
}

export async function getTransactions(userId: string, limit = 50) {
  if (!userId) {
    console.error('getTransactions: userId is missing')
    return { success: false, error: 'User ID is required' }
  }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    console.log('data', data)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Get transactions error:', error)
    return { success: false, error: 'Failed to fetch transactions' }
  }
}

export async function updateTransaction(
  id: string,
  userId: string,
  data: UpdateTransactionInput
) {
  try {
    const validated = updateTransactionSchema.parse(data)

    const { data: transaction, error } = await insforgeAdmin.database
      .from('transactions')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Update transaction error:', error)
    return { success: false, error: 'Failed to update transaction' }
  }
}

export async function deleteTransaction(id: string, userId: string) {
  try {
    const { error } = await insforgeAdmin.database
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to delete transaction' }
  }
}
