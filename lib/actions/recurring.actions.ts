'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
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
    const today = new Date().toISOString().split('T')[0]

    const { data: active, error: fetchError1 } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('end_date', null)

    const { data: withEndDate, error: fetchError2 } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select()
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', today)

    if (fetchError1) throw fetchError1
    if (fetchError2) throw fetchError2
    const recurringTransactions = [...(active || []), ...(withEndDate || [])]

    const transactions = []

    for (const recurring of recurringTransactions || []) {
      const lastGenerated = recurring.last_generated ? new Date(recurring.last_generated) : new Date(recurring.start_date)
      const nextDate = getNextDate(lastGenerated, recurring.frequency)

      if (nextDate.toISOString().split('T')[0] <= today) {
        const { error: insertError } = await insforgeAdmin.database
          .from('transactions')
          .insert([{
            user_id: userId,
            amount: recurring.amount,
            currency: recurring.currency,
            type: recurring.type,
            category_id: recurring.category_id,
            account_id: recurring.account_id ?? null,
            description: recurring.description,
            date: nextDate.toISOString().split('T')[0],
            source: 'manual',
          }])

        if (insertError) {
          console.error('generateRecurringTransactions: insert error for recurring', recurring.id, JSON.stringify(insertError))
        }

        if (!insertError) {
          await insforgeAdmin.database
            .from('recurring_transactions')
            .update({ last_generated: today })
            .eq('id', recurring.id)

          transactions.push(recurring)
        }
      }
    }

    revalidatePath('/recurring-transactions')
    return { success: true, data: { generated: transactions.length } }
  } catch (error) {
    console.error('Generate recurring transactions error:', error)
    return { success: false, error: 'Failed to generate recurring transactions' }
  }
}

function getNextDate(lastDate: Date, frequency: string): Date {
  const date = new Date(lastDate)

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }

  return date
}
