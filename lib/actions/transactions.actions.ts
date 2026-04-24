'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { applyBalanceDelta } from '@/lib/utils/balance-updater'
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

    if (validated.account_id) {
      const direction = validated.type === 'income' ? 'add' : 'subtract'
      await applyBalanceDelta(validated.account_id, validated.amount, validated.currency, direction)
    }

    revalidatePath('/transactions')
    revalidatePath('/movimientos')
    revalidatePath('/dashboard')
    revalidatePath('/settings')
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
    const { data: oldTx, error: fetchError } = await insforgeAdmin.database
      .from('transactions')
      .select('account_id, type, amount, currency')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const validated = updateTransactionSchema.parse(data)

    const { data: transaction, error } = await insforgeAdmin.database
      .from('transactions')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Reverse old account effect
    if (oldTx.account_id) {
      const reverseDirection = oldTx.type === 'expense' ? 'add' : 'subtract'
      await applyBalanceDelta(oldTx.account_id, Number(oldTx.amount), oldTx.currency, reverseDirection)
    }

    // Apply new account effect
    if (transaction.account_id) {
      const applyDirection = transaction.type === 'income' ? 'add' : 'subtract'
      await applyBalanceDelta(transaction.account_id, Number(transaction.amount), transaction.currency, applyDirection)
    }

    revalidatePath('/transactions')
    revalidatePath('/movimientos')
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    revalidatePath('/calendar')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Update transaction error:', error)
    return { success: false, error: 'Failed to update transaction' }
  }
}

export async function deleteTransaction(id: string, userId: string) {
  try {
    const { data: tx } = await insforgeAdmin.database
      .from('transactions')
      .select('account_id, type, amount, currency')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    const { error } = await insforgeAdmin.database
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    if (tx?.account_id) {
      const reverseDirection = tx.type === 'expense' ? 'add' : 'subtract'
      await applyBalanceDelta(tx.account_id, Number(tx.amount), tx.currency, reverseDirection)
    }

    revalidatePath('/transactions')
    revalidatePath('/movimientos')
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    revalidatePath('/calendar')
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to delete transaction' }
  }
}
