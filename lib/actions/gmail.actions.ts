'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'
import {
  parseGmailForUser,
  commitParsedTransactions,
  type ParsedItem,
  type CommitInput,
} from '@/lib/gmail/process'

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

function revalidateAfterMutation() {
  revalidatePath('/transactions')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

export interface SyncGmailSuccess {
  success: true
  items: ParsedItem[]
  scanned: number
  skipped: number
  errors: number
}

export async function syncGmail(): Promise<
  SyncGmailSuccess | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    const result = await parseGmailForUser(userId)
    return {
      success: true,
      items: result.items,
      scanned: result.scanned,
      skipped: result.skipped,
      errors: result.errors,
    }
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

export async function commitGmailTransactions(
  items: CommitInput[]
): Promise<
  | { success: true; created: number; errors: string[] }
  | { success: false; error: string }
> {
  try {
    const userId = await requireUserId()
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'No hay transacciones para registrar' }
    }
    for (const item of items) {
      if (!item.category_id) {
        return { success: false, error: 'Cada transacción debe tener categoría asignada' }
      }
    }
    const result = await commitParsedTransactions(userId, items)
    revalidateAfterMutation()
    return { success: true, created: result.created, errors: result.errors }
  } catch (err) {
    console.error('commitGmailTransactions error:', err)
    return { success: false, error: 'Error al registrar transacciones' }
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
