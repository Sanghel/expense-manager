'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { reminderSchema, type ReminderFormData } from '@/lib/validations/reminder'
import { getTransactionsBetween } from '@/lib/actions/transactions.actions'
import {
  getPendingOccurrences,
  type OccurrenceDismissal,
  type OccurrenceTransaction,
} from '@/lib/reminders/pending'
import { getLocalDateString } from '@/lib/utils/dates'
import type { ReminderWithCategory } from '@/types/database.types'

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
  revalidatePath('/movimientos')
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
  revalidatePath('/movimientos')
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
  revalidatePath('/movimientos')
  return { success: true }
}

/**
 * Everything the notification bell needs: the pending occurrences in a window
 * around today, already matched against settled transactions and dismissals.
 */
export async function getReminderNotifications(
  userId: string,
  { lookbackDays = 7, lookaheadDays = 7 }: { lookbackDays?: number; lookaheadDays?: number } = {}
) {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  const today = new Date()
  const from = getLocalDateString(new Date(today.getTime() - lookbackDays * 86400000))
  const to = getLocalDateString(new Date(today.getTime() + lookaheadDays * 86400000))

  try {
    const [remindersResult, txResult, dismissalsResult] = await Promise.all([
      getReminders(userId),
      getTransactionsBetween(userId, from, to),
      insforgeAdmin.database
        .from('reminder_dismissals')
        .select('reminder_id, occurrence_date, snoozed_until')
        .eq('user_id', userId)
        .gte('occurrence_date', from)
        .lte('occurrence_date', to),
    ])

    if (dismissalsResult.error) throw dismissalsResult.error

    const reminders = (remindersResult.success ? (remindersResult.data ?? []) : []) as ReminderWithCategory[]
    const transactions = (txResult.success ? (txResult.data ?? []) : []) as OccurrenceTransaction[]
    const dismissals = (dismissalsResult.data ?? []) as OccurrenceDismissal[]

    const occurrences = getPendingOccurrences(reminders, transactions, dismissals, {
      lookbackDays,
      lookaheadDays,
      today,
    })

    return { success: true, data: occurrences }
  } catch (error) {
    console.error('Get reminder notifications error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones',
    }
  }
}

function revalidateReminders() {
  revalidatePath('/calendar')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
}

/** Hides one occurrence for good. */
export async function dismissReminderOccurrence(
  userId: string,
  reminderId: string,
  occurrenceDate: string
) {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  const { error } = await insforgeAdmin.database
    .from('reminder_dismissals')
    .upsert(
      {
        user_id: userId,
        reminder_id: reminderId,
        occurrence_date: occurrenceDate,
        snoozed_until: null,
      },
      { onConflict: 'reminder_id,occurrence_date' }
    )

  if (error) return { success: false, error: error.message }

  revalidateReminders()
  return { success: true }
}

/** Hides one occurrence until `snoozedUntil` (a 'YYYY-MM-DD' date). */
export async function snoozeReminderOccurrence(
  userId: string,
  reminderId: string,
  occurrenceDate: string,
  snoozedUntil: string
) {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  const { error } = await insforgeAdmin.database
    .from('reminder_dismissals')
    .upsert(
      {
        user_id: userId,
        reminder_id: reminderId,
        occurrence_date: occurrenceDate,
        snoozed_until: snoozedUntil,
      },
      { onConflict: 'reminder_id,occurrence_date' }
    )

  if (error) return { success: false, error: error.message }

  revalidateReminders()
  return { success: true }
}

export async function toggleReminderActive(userId: string, id: string, isActive: boolean) {
  if (!userId) return { success: false, error: 'Falta el identificador de usuario' }

  const { data, error } = await insforgeAdmin.database
    .from('reminders')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidateReminders()
  return { success: true, data }
}
