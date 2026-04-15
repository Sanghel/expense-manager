'use server'

import { insforge } from '@/lib/insforge'
import {
  createCategorySchema,
  type CreateCategoryInput,
} from '@/lib/validations/category'

export async function getCategories(userId: string) {
  try {
    const { data, error } = await insforge
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name')

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function createCategory(
  userId: string,
  data: CreateCategoryInput
) {
  try {
    const validated = createCategorySchema.parse(data)

    const { data: category, error } = await insforge
      .from('categories')
      .insert({
        ...validated,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data: category }
  } catch (error) {
    console.error('Create category error:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

export async function deleteCategory(id: string, userId: string) {
  try {
    const { error } = await insforge
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete category' }
  }
}
