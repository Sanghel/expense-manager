'use server'

import { insforge } from '@/lib/insforge'
import {
  createCategorySchema,
  type CreateCategoryInput,
} from '@/lib/validations/category'

export async function getCategories(userId: string) {
  try {
    // Obtener predefinidas (user_id null) + del usuario en dos queries
    const [{ data: predefined, error: e1 }, { data: userCats, error: e2 }] =
      await Promise.all([
        insforge.database.from('categories').select('*').is('user_id', null).order('name'),
        insforge.database.from('categories').select('*').eq('user_id', userId).order('name'),
      ])

    if (e1) throw e1
    if (e2) throw e2

    return { success: true, data: [...(predefined ?? []), ...(userCats ?? [])] }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function createCategory(
  userId: string,
  data: CreateCategoryInput
) {
  try {
    const validated = createCategorySchema.parse(data)

    const { data: category, error } = await insforge.database
      .from('categories')
      .insert([{ ...validated, user_id: userId }])
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
    const { error } = await insforge.database
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to delete category' }
  }
}
