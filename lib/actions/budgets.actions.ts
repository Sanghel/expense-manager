'use server'

import { revalidatePath } from 'next/cache'
import { insforge } from '@/lib/insforge'
import {
  createBudgetSchema,
  type CreateBudgetInput,
} from '@/lib/validations/budget'

export async function getBudgets(userId: string) {
  try {
    const { data, error } = await insforge
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch budgets' }
  }
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  try {
    const validated = createBudgetSchema.parse(data)

    const { data: budget, error } = await insforge
      .from('budgets')
      .insert({
        ...validated,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, data: budget }
  } catch (error) {
    console.error('Create budget error:', error)
    return { success: false, error: 'Failed to create budget' }
  }
}

export async function updateBudget(
  id: string,
  userId: string,
  data: Partial<CreateBudgetInput>
) {
  try {
    const validated = createBudgetSchema.partial().parse(data)

    const { data: budget, error } = await insforge
      .from('budgets')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, data: budget }
  } catch (error) {
    console.error('Update budget error:', error)
    return { success: false, error: 'Failed to update budget' }
  }
}

export async function deleteBudget(id: string, userId: string) {
  try {
    const { error } = await insforge
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete budget' }
  }
}
