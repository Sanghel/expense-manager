'use server'

import { revalidatePath } from 'next/cache'
import { insforge } from '@/lib/insforge'
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

    const { data: transaction, error } = await insforge
      .from('transactions')
      .insert({
        ...validated,
        user_id: userId,
        source: 'manual',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Create transaction error:', error)
    return { success: false, error: 'Failed to create transaction' }
  }
}

export async function getTransactions(userId: string, limit = 50) {
  try {
    const { data, error } = await insforge
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
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

    const { data: transaction, error } = await insforge
      .from('transactions')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Update transaction error:', error)
    return { success: false, error: 'Failed to update transaction' }
  }
}

export async function deleteTransaction(id: string, userId: string) {
  try {
    const { error } = await insforge
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete transaction' }
  }
}
