'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { createTagSchema, type CreateTagInput } from '@/lib/validations/tags'
import type { Tag } from '@/types/database.types'

export async function createTag(userId: string, data: CreateTagInput) {
  try {
    const validated = createTagSchema.parse(data)
    const { data: tag, error } = await insforgeAdmin.database
      .from('tags')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true, data: tag as Tag }
  } catch (error) {
    console.error('Create tag error:', error)
    return { success: false, error: 'Failed to create tag' }
  }
}

export async function getTags(userId: string) {
  try {
    const { data, error } = await insforgeAdmin.database
      .from('tags')
      .select()
      .eq('user_id', userId)
      .order('name')
    if (error) throw error
    return { success: true, data: data as Tag[] }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch tags' }
  }
}

export async function deleteTag(id: string, userId: string) {
  try {
    const { error } = await insforgeAdmin.database
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete tag error:', error)
    return { success: false, error: 'Failed to delete tag' }
  }
}

export async function addTagToTransaction(transactionId: string, tagId: string) {
  try {
    const { error } = await insforgeAdmin.database
      .from('transaction_tags')
      .insert([{ transaction_id: transactionId, tag_id: tagId }])
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Add tag to transaction error:', error)
    return { success: false, error: 'Failed to add tag' }
  }
}

export async function removeTagFromTransaction(transactionId: string, tagId: string) {
  try {
    const { error } = await insforgeAdmin.database
      .from('transaction_tags')
      .delete()
      .eq('transaction_id', transactionId)
      .eq('tag_id', tagId)
    if (error) throw error
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Remove tag from transaction error:', error)
    return { success: false, error: 'Failed to remove tag' }
  }
}

export async function getTransactionTags(transactionId: string) {
  try {
    const { data, error } = await insforgeAdmin.database
      .from('transaction_tags')
      .select('tag_id, tags(*)')
      .eq('transaction_id', transactionId)
    if (error) throw error
    return { success: true, data: data?.map(item => item.tags) || [] }
  } catch (_error) {
    return { success: false, error: 'Failed to fetch tags' }
  }
}
