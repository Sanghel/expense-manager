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

    if (validated.account_id) {
      const rpcName = validated.type === 'income' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforgeAdmin.database.rpc(rpcName, { account_id: validated.account_id, amount: validated.amount })
    }

    revalidatePath('/transactions')
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
      .select('account_id, type, amount')
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
      const reverseRpc = oldTx.type === 'expense' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforgeAdmin.database.rpc(reverseRpc, { account_id: oldTx.account_id, amount: Number(oldTx.amount) })
    }

    // Apply new account effect
    if (transaction.account_id) {
      const applyRpc = transaction.type === 'income' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforgeAdmin.database.rpc(applyRpc, { account_id: transaction.account_id, amount: Number(transaction.amount) })
    }

    revalidatePath('/transactions')
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
      .select('account_id, type, amount')
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
      const reverseRpc = tx.type === 'expense' ? 'increment_account_balance' : 'decrement_account_balance'
      await insforgeAdmin.database.rpc(reverseRpc, { account_id: tx.account_id, amount: Number(tx.amount) })
    }

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    revalidatePath('/calendar')
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to delete transaction' }
  }
}
