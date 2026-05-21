'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { applyBalanceDelta } from '@/lib/utils/balance-updater'
import { syncGmailForUser, type SyncResult } from '@/lib/gmail/process'
import type {
  TransactionDraft,
  Currency,
  TransactionType,
} from '@/types/database.types'

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

function revalidateAfterMutation() {
  revalidatePath('/transactions')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  revalidatePath('/pendientes')
  revalidatePath('/settings')
}

export async function syncGmail(): Promise<
  { success: true; data: SyncResult } | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const data = await syncGmailForUser(userId)
    revalidateAfterMutation()
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'GMAIL_NOT_CONNECTED') {
      return {
        success: false,
        error: 'Gmail no conectado. Inicia sesión de nuevo otorgando permiso de Gmail.',
      }
    }
    console.error('syncGmail error:', err)
    return { success: false, error: 'No se pudo sincronizar con Gmail' }
  }
}

export async function listPendingDrafts(): Promise<
  { success: true; data: TransactionDraft[] } | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const { data, error } = await insforgeAdmin.database
      .from('transaction_drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: (data ?? []) as TransactionDraft[] }
  } catch (err) {
    console.error('listPendingDrafts error:', err)
    return { success: false, error: 'No se pudieron cargar los pendientes' }
  }
}

export interface ConfirmDraftOverrides {
  amount?: number
  currency?: Currency
  type?: TransactionType
  category_id?: string
  account_id?: string | null
  description?: string
  date?: string
  notes?: string
}

export async function confirmDraft(
  draftId: string,
  overrides: ConfirmDraftOverrides = {}
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await requireUserId()

    const { data: draft, error: fetchError } = await insforgeAdmin.database
      .from('transaction_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !draft) {
      return { success: false, error: 'Pendiente no encontrado' }
    }

    const final = {
      amount: overrides.amount ?? Number(draft.amount),
      currency: (overrides.currency ?? draft.currency) as Currency,
      type: (overrides.type ?? draft.type) as TransactionType,
      category_id: overrides.category_id ?? draft.category_id,
      account_id: overrides.account_id !== undefined ? overrides.account_id : draft.account_id,
      description: overrides.description ?? draft.description ?? '',
      date: overrides.date ?? draft.date,
      notes: overrides.notes ?? draft.notes,
    }

    if (!final.amount || !final.currency || !final.type || !final.category_id || !final.description || !final.date) {
      return { success: false, error: 'Faltan campos obligatorios para confirmar' }
    }

    const { data: created, error: insertError } = await insforgeAdmin.database
      .from('transactions')
      .insert([
        {
          user_id: userId,
          amount: final.amount,
          currency: final.currency,
          type: final.type,
          category_id: final.category_id,
          account_id: final.account_id,
          description: final.description,
          date: final.date,
          notes: final.notes,
          source: 'gmail',
        },
      ])
      .select('id')
      .single()

    if (insertError || !created) {
      console.error('confirmDraft insert error:', insertError)
      return { success: false, error: 'No se pudo crear la transacción' }
    }

    if (final.account_id) {
      const direction = final.type === 'income' ? 'add' : 'subtract'
      await applyBalanceDelta(final.account_id, final.amount, final.currency, direction)
    }

    await insforgeAdmin.database
      .from('transaction_drafts')
      .update({ status: 'confirmed', resolved_at: new Date().toISOString() })
      .eq('id', draftId)
      .eq('user_id', userId)

    await insforgeAdmin.database
      .from('processed_emails')
      .update({ outcome: 'auto_registered', transaction_id: created.id })
      .eq('gmail_message_id', draft.gmail_message_id)

    revalidateAfterMutation()
    return { success: true }
  } catch (err) {
    console.error('confirmDraft error:', err)
    return { success: false, error: 'Error al confirmar el pendiente' }
  }
}

export async function rejectDraft(
  draftId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const userId = await requireUserId()
    const { error } = await insforgeAdmin.database
      .from('transaction_drafts')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', draftId)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (error) throw error
    revalidateAfterMutation()
    return { success: true }
  } catch (err) {
    console.error('rejectDraft error:', err)
    return { success: false, error: 'No se pudo rechazar el pendiente' }
  }
}

export async function disconnectGmail(): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const { error } = await insforgeAdmin.database
      .from('users')
      .update({
        gmail_refresh_token: null,
        gmail_connected_at: null,
        gmail_last_synced_at: null,
      })
      .eq('id', userId)
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('disconnectGmail error:', err)
    return { success: false, error: 'No se pudo desconectar Gmail' }
  }
}

export async function getGmailStatus(): Promise<{
  connected: boolean
  connectedAt: string | null
  lastSyncedAt: string | null
}> {
  const userId = await requireUserId()
  const { data } = await insforgeAdmin.database
    .from('users')
    .select('gmail_refresh_token, gmail_connected_at, gmail_last_synced_at')
    .eq('id', userId)
    .single()
  return {
    connected: !!data?.gmail_refresh_token,
    connectedAt: data?.gmail_connected_at ?? null,
    lastSyncedAt: data?.gmail_last_synced_at ?? null,
  }
}
