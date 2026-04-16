'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createBudgetSchema,
  type CreateBudgetInput,
} from '@/lib/validations/budget'

export async function getBudgets(userId: string) {
  try {
    const { data: budgets, error: budgetError } = await insforgeAdmin.database
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (budgetError) throw budgetError

    if (!budgets || budgets.length === 0) {
      return { success: true, data: [] }
    }

    const { data: transactions, error: transError } = await insforgeAdmin.database
      .from('transactions')
      .select('category_id, amount, date, type')
      .eq('user_id', userId)
      .eq('type', 'expense')

    if (transError) throw transError

    const budgetsWithSpent = budgets.map((budget) => {
      const now = new Date()
      const startDate = new Date(budget.start_date)
      
      let periodStart: Date, periodEnd: Date
      
      if (budget.period === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      } else {
        periodStart = new Date(now.getFullYear(), 0, 1)
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      }
      
      const spent = (transactions || [])
        .filter((t) => {
          const transDate = new Date(t.date)
          return (
            t.category_id === budget.category_id &&
            transDate >= periodStart &&
            transDate <= periodEnd
          )
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      return {
        ...budget,
        spent,
      }
    })

    return { success: true, data: budgetsWithSpent }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch budgets' }
  }
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  try {
    const validated = createBudgetSchema.parse(data)

    const { data: budget, error } = await insforgeAdmin.database
      .from('budgets')
      .insert([{ ...validated, user_id: userId }])
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

    const { data: budget, error } = await insforgeAdmin.database
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
    const { error } = await insforgeAdmin.database
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to delete budget' }
  }
}
