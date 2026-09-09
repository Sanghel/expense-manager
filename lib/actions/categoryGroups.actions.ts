'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  createCategoryGroupSchema,
  updateCategoryGroupSchema,
  setGroupMembersSchema,
  type CreateCategoryGroupInput,
  type UpdateCategoryGroupInput,
} from '@/lib/validations/categoryGroup'
import type { CategoryGroup, CategoryGroupWithMembers } from '@/types/database.types'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

function revalidateGroups() {
  revalidatePath('/categories')
  revalidatePath('/settings')
  revalidatePath('/planificacion')
  revalidatePath('/dashboard')
}

export async function getCategoryGroups(userId: string) {
  if (!userId) {
    console.error('getCategoryGroups: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { data: groups, error } = await insforgeAdmin.database
      .from('category_groups')
      .select()
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    if (!groups || groups.length === 0) {
      return { success: true, data: [] as CategoryGroupWithMembers[] }
    }

    // Two explicit queries rather than a two-hop embed: the join table has no
    // FK alias the SDK can resolve from `category_groups` in one call.
    const { data: members, error: membersError } = await insforgeAdmin.database
      .from('category_group_members')
      .select('group_id, category_id')
      .in(
        'group_id',
        groups.map((g) => g.id)
      )

    if (membersError) throw membersError

    const byGroup = new Map<string, string[]>()
    for (const m of members ?? []) {
      const list = byGroup.get(m.group_id) ?? []
      list.push(m.category_id)
      byGroup.set(m.group_id, list)
    }

    const data: CategoryGroupWithMembers[] = groups.map((g) => ({
      ...(g as CategoryGroup),
      category_ids: byGroup.get(g.id) ?? [],
    }))

    return { success: true, data }
  } catch (error) {
    console.error('Get category groups error:', error)
    return { success: false, error: errorMessage(error, 'No se pudieron cargar los grupos') }
  }
}

export async function createCategoryGroup(
  userId: string,
  data: CreateCategoryGroupInput & { category_ids?: string[] }
) {
  if (!userId) {
    console.error('createCategoryGroup: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const validated = createCategoryGroupSchema.parse(data)

    const { data: group, error } = await insforgeAdmin.database
      .from('category_groups')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error

    if (data.category_ids?.length) {
      const membersResult = await setGroupMembers(userId, group.id, data.category_ids)
      if (!membersResult.success) return membersResult
    }

    revalidateGroups()
    return { success: true, data: group as CategoryGroup }
  } catch (error) {
    console.error('Create category group error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo crear el grupo') }
  }
}

export async function updateCategoryGroup(
  userId: string,
  id: string,
  data: UpdateCategoryGroupInput
) {
  if (!userId) {
    console.error('updateCategoryGroup: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const validated = updateCategoryGroupSchema.parse(data)

    const { data: group, error } = await insforgeAdmin.database
      .from('category_groups')
      .update(validated)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidateGroups()
    return { success: true, data: group as CategoryGroup }
  } catch (error) {
    console.error('Update category group error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo actualizar el grupo') }
  }
}

/** Replaces the group's members with exactly `categoryIds`. */
export async function setGroupMembers(userId: string, groupId: string, categoryIds: string[]) {
  if (!userId) {
    console.error('setGroupMembers: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { category_ids } = setGroupMembersSchema.parse({ category_ids: categoryIds })

    // Ownership is enforced here: the join table has no user_id of its own.
    const { data: group, error: groupError } = await insforgeAdmin.database
      .from('category_groups')
      .select('id')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single()

    if (groupError) throw groupError
    if (!group) return { success: false, error: 'Grupo no encontrado' }

    const { error: deleteError } = await insforgeAdmin.database
      .from('category_group_members')
      .delete()
      .eq('group_id', groupId)

    if (deleteError) throw deleteError

    if (category_ids.length > 0) {
      const { error: insertError } = await insforgeAdmin.database
        .from('category_group_members')
        .insert(category_ids.map((category_id) => ({ group_id: groupId, category_id })))

      if (insertError) throw insertError
    }

    revalidateGroups()
    return { success: true }
  } catch (error) {
    console.error('Set group members error:', error)
    return { success: false, error: errorMessage(error, 'No se pudieron guardar las categorías del grupo') }
  }
}

export async function deleteCategoryGroup(userId: string, id: string) {
  if (!userId) {
    console.error('deleteCategoryGroup: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    // Mirrors deleteCategory's guard: refuse while something still points here.
    const { data: budgets, error: budgetError } = await insforgeAdmin.database
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('group_id', id)
      .limit(1)

    if (budgetError) throw budgetError
    if (budgets && budgets.length > 0) {
      return {
        success: false,
        error: 'No puedes eliminar un grupo que tiene un presupuesto asociado',
      }
    }

    const { error } = await insforgeAdmin.database
      .from('category_groups')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidateGroups()
    return { success: true }
  } catch (error) {
    console.error('Delete category group error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo eliminar el grupo') }
  }
}
