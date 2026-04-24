'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  addFundsSchema,
  type CreateSavingsGoalInput,
  type UpdateSavingsGoalInput,
  type AddFundsInput,
} from '@/lib/validations/savings'
import type { SavingsGoal } from '@/types/database.types'

export async function createSavingsGoal(userId: string, data: CreateSavingsGoalInput) {
  if (!userId) {
    console.error('createSavingsGoal: userId is missing')
    return { success: false, error: 'User ID is required' }
  }
  try {
    const validated = createSavingsGoalSchema.parse(data)

    // Verify user exists
    const { data: user, error: userError } = await insforgeAdmin.database
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userId, userError)
      return { success: false, error: 'Usuario no encontrado' }
    }

    const { data: goal, error } = await insforgeAdmin.database
      .from('savings_goals')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/savings-goals')
    revalidatePath('/planificacion')
    return { success: true, data: goal as SavingsGoal }
  } catch (error) {
    console.error('Create savings goal error:', error)
    return { success: false, error: 'Failed to create savings goal' }
  }
}

export async function getSavingsGoals(userId: string) {
  if (!userId) {
    console.error('getSavingsGoals: userId is missing')
    return { success: false, error: 'User ID is required' }
  }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('savings_goals')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data as SavingsGoal[] }
  } catch (error) {
    console.error('Get savings goals error:', error)
    return { success: false, error: 'Failed to fetch savings goals' }
  }
}

export async function updateSavingsGoal(id: string, userId: string, data: UpdateSavingsGoalInput) {
  try {
    const validated = updateSavingsGoalSchema.parse(data)

    const { data: goal, error } = await insforgeAdmin.database
      .from('savings_goals')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/savings-goals')
    revalidatePath('/planificacion')
    return { success: true, data: goal as SavingsGoal }
  } catch (error) {
    console.error('Update savings goal error:', error)
    return { success: false, error: 'Failed to update savings goal' }
  }
}

export async function deleteSavingsGoal(id: string, userId: string) {
  try {
    const { error } = await insforgeAdmin.database
      .from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/savings-goals')
    revalidatePath('/planificacion')
    return { success: true }
  } catch (error) {
    console.error('Delete savings goal error:', error)
    return { success: false, error: 'Failed to delete savings goal' }
  }
}

export async function addFundsToGoal(id: string, userId: string, data: AddFundsInput) {
  try {
    const validated = addFundsSchema.parse(data)

    const { data: goal, error: fetchError } = await insforgeAdmin.database
      .from('savings_goals')
      .select()
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const newAmount = Math.min(goal.current_amount + validated.amount, goal.target_amount)
    const isCompleted = newAmount >= goal.target_amount

    const { data: updated, error: updateError } = await insforgeAdmin.database
      .from('savings_goals')
      .update({ current_amount: newAmount, is_completed: isCompleted })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) throw updateError

    revalidatePath('/savings-goals')
    revalidatePath('/planificacion')
    return { success: true, data: updated as SavingsGoal }
  } catch (error) {
    console.error('Add funds to goal error:', error)
    return { success: false, error: 'Failed to add funds' }
  }
}

export async function markGoalAsCompleted(id: string, userId: string) {
  try {
    const { data: goal, error } = await insforgeAdmin.database
      .from('savings_goals')
      .update({ is_completed: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/savings-goals')
    revalidatePath('/planificacion')
    return { success: true, data: goal as SavingsGoal }
  } catch (error) {
    console.error('Mark goal as completed error:', error)
    return { success: false, error: 'Failed to mark as completed' }
  }
}
