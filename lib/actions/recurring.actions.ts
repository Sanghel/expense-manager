'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { generateRecurringForUser } from '@/lib/utils/recurring-generator'
import {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  type CreateRecurringTransactionInput,
  type UpdateRecurringTransactionInput,
} from '@/lib/validations/recurring'
import type { RecurringTransactionWithCategory } from '@/types/database.types'

export async function createRecurringTransaction(
  userId: string,
  data: CreateRecurringTransactionInput
) {
  if (!userId) {
    return { success: false, error: 'User ID is required' }
  }
  try {
    const validated = createRecurringTransactionSchema.parse(data)

    const { data: transaction, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .insert([{
        user_id: userId,
        amount: validated.amount,
        currency: validated.currency,
        type: validated.type,
        category_id: validated.category_id,
        account_id: validated.account_id ?? null,
        description: validated.description,
        frequency: validated.frequency,
        start_date: validated.start_date,
        end_date: validated.end_date || null,
      }])
      .select('*, category:categories(*)')
      .single()

    if (error) throw error

    revalidatePath('/recurring-transactions')
    return { success: true, data: transaction as RecurringTransactionWithCategory }
  } catch (error) {
    console.error('Create recurring transaction error:', error)
    return { success: false, error: 'Failed to create recurring transaction' }
  }
}

export async function getRecurringTransactions(userId: string, limit = 50) {
  if (!userId) {
    console.error('getRecurringTransactions: userId is missing')
    return { success: false, error: 'User ID is required' }
  }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data: data as RecurringTransactionWithCategory[] }
  } catch (error) {
    console.error('Get recurring transactions error:', error)
    return { success: false, error: 'Failed to fetch recurring transactions' }
  }
}

export async function updateRecurringTransaction(
  id: string,
  userId: string,
  data: UpdateRecurringTransactionInput
) {
  try {
    const validated = updateRecurringTransactionSchema.parse(data)

    const { data: transaction, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, category:categories(*)')
      .single()

    if (error) throw error

    revalidatePath('/recurring-transactions')
    return { success: true, data: transaction as RecurringTransactionWithCategory }
  } catch (error) {
    console.error('Update recurring transaction error:', error)
    return { success: false, error: 'Failed to update recurring transaction' }
  }
}

export async function deleteRecurringTransaction(id: string, userId: string) {
  try {
    const { error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/recurring-transactions')
    return { success: true }
  } catch (error) {
    console.error('Delete recurring transaction error:', error)
    return { success: false, error: 'Failed to delete recurring transaction' }
  }
}

export async function toggleRecurringTransaction(id: string, userId: string, isActive: boolean) {
  try {
    const { data, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, category:categories(*)')
      .single()

    if (error) throw error

    revalidatePath('/recurring-transactions')
    return { success: true, data: data as RecurringTransactionWithCategory }
  } catch (error) {
    console.error('Toggle recurring transaction error:', error)
    return { success: false, error: 'Failed to toggle recurring transaction' }
  }
}

export async function generateRecurringTransactions(userId: string) {
  try {
    const result = await generateRecurringForUser(userId)
    console.log('[generateRecurringTransactions] result:', JSON.stringify(result))
    revalidatePath('/recurring-transactions')
    if (result.errors.length > 0) {
      return {
        success: true,
        data: { generated: result.generated, skipped: result.skipped },
        error: `Errores: ${result.errors.join(' | ')}`,
      }
    }
    return { success: true, data: { generated: result.generated, skipped: result.skipped } }
  } catch (error) {
    console.error('generateRecurringTransactions wrapper error:', error)
    return { success: false, error: 'Failed to generate recurring transactions' }
  }
}
