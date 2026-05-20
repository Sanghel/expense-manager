'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/lib/validations/category'

export async function getCategories(userId: string) {
  if (!userId) {
    console.error('getCategories: userId is missing')
    return { success: false, error: 'User ID is required' }
  }
  try {
    const [{ data: predefined, error: e1 }, { data: userCats, error: e2 }] =
      await Promise.all([
        insforgeAdmin.database.from('categories').select('*').is('user_id', null).order('name'),
        insforgeAdmin.database.from('categories').select('*').eq('user_id', userId).order('name'),
      ])

    if (e1) throw e1
    if (e2) throw e2

    return { success: true, data: [...(predefined ?? []), ...(userCats ?? [])] }
  } catch (error) {
    console.error('Get categories error:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

async function checkDuplicateName(userId: string, name: string, excludeId?: string) {
  const { data } = await insforgeAdmin.database
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)

  if (!data) return false

  return data.some((cat) => {
    if (excludeId && cat.id === excludeId) return false
    return cat.name.toUpperCase() === name.toUpperCase()
  })
}

export async function createCategory(
  userId: string,
  data: CreateCategoryInput
) {
  try {
    const validated = createCategorySchema.parse(data)

    const isDuplicate = await checkDuplicateName(userId, validated.name)
    if (isDuplicate) {
      return { success: false, error: `Ya existe una categoría con el nombre "${validated.name}"` }
    }

    const { data: category, error } = await insforgeAdmin.database
      .from('categories')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error
    revalidatePath('/categories')
    revalidatePath('/settings')
    return { success: true, data: category }
  } catch (error) {
    console.error('Create category error:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

export async function updateCategory(
  id: string,
  userId: string,
  data: UpdateCategoryInput
) {
  try {
    const validated = updateCategorySchema.parse(data)

    if (validated.name) {
      const isDuplicate = await checkDuplicateName(userId, validated.name, id)
      if (isDuplicate) {
        return { success: false, error: `Ya existe una categoría con el nombre "${validated.name}"` }
      }
    }

    const { data: category, error } = await insforgeAdmin.database
      .from('categories')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/categories')
    revalidatePath('/settings')
    return { success: true, data: category }
  } catch (error) {
    console.error('Update category error:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

export async function deleteCategory(id: string, userId: string) {
  try {
    const { data: txCount } = await insforgeAdmin.database
      .from('transactions')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', userId)
      .limit(1)

    if (txCount && txCount.length > 0) {
      return { success: false, error: 'No se puede eliminar: la categoría tiene transacciones asociadas' }
    }

    const { error } = await insforgeAdmin.database
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    revalidatePath('/categories')
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Delete category error:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}
