'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { reminderSchema, type ReminderFormData } from '@/lib/validations/reminder'

export async function getReminders(userId: string) {
  const { data, error } = await insforgeAdmin.database
    .from('reminders')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createReminder(userId: string, input: ReminderFormData) {
  const parsed = reminderSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data, error } = await insforgeAdmin.database
    .from('reminders')
    .insert({ ...parsed.data, user_id: userId })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/calendar')
  return { success: true, data }
}

export async function updateReminder(userId: string, id: string, input: ReminderFormData) {
  const parsed = reminderSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data, error } = await insforgeAdmin.database
    .from('reminders')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/calendar')
  return { success: true, data }
}

export async function deleteReminder(userId: string, id: string) {
  const { error } = await insforgeAdmin.database
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/calendar')
  return { success: true }
}
