'use server'

import { revalidatePath } from 'next/cache'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { applyBalanceDelta } from '@/lib/utils/balance-updater'
import { convertAmount } from '@/lib/utils/exchange'
import { toNumber } from '@/lib/utils/numbers'
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  addFundsSchema,
  type CreateSavingsGoalInput,
  type UpdateSavingsGoalInput,
  type AddFundsInput,
} from '@/lib/validations/savings'
import type { SavingsGoal } from '@/types/database.types'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

/**
 * Postgres `numeric` arrives as a string through the SDK. Coercing at the
 * action boundary keeps the `SavingsGoal` type honest for every consumer.
 */
function normalizeGoal(row: Record<string, unknown>): SavingsGoal {
  return {
    ...(row as unknown as SavingsGoal),
    target_amount: toNumber(row.target_amount),
    current_amount: toNumber(row.current_amount),
    is_completed: Boolean(row.is_completed),
  }
}

function revalidateSavings() {
  revalidatePath('/planificacion')
  revalidatePath('/dashboard')
  revalidatePath('/consejos-ahorro')
}

export async function createSavingsGoal(userId: string, data: CreateSavingsGoalInput) {
  if (!userId) {
    console.error('createSavingsGoal: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const validated = createSavingsGoalSchema.parse(data)

    // Verify user exists
    const { data: user, error: userError } = await insforgeAdmin.database
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userId, userError)
      return { success: false, error: 'Usuario no encontrado' }
    }

    const { data: goal, error } = await insforgeAdmin.database
      .from('savings_goals')
      .insert([{ ...validated, user_id: userId }])
      .select()
      .single()

    if (error) throw error

    revalidateSavings()
    return { success: true, data: normalizeGoal(goal) }
  } catch (error) {
    console.error('Create savings goal error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo crear la meta') }
  }
}

export async function getSavingsGoals(userId: string) {
  if (!userId) {
    console.error('getSavingsGoals: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { data, error } = await insforgeAdmin.database
      .from('savings_goals')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: (data ?? []).map(normalizeGoal) }
  } catch (error) {
    console.error('Get savings goals error:', error)
    return { success: false, error: errorMessage(error, 'No se pudieron cargar las metas') }
  }
}

export async function updateSavingsGoal(id: string, userId: string, data: UpdateSavingsGoalInput) {
  if (!userId) {
    console.error('updateSavingsGoal: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const validated = updateSavingsGoalSchema.parse(data)

    const payload: Record<string, unknown> = { ...validated }

    // Raising the target must reopen a goal that was previously completed,
    // otherwise "Añadir Fondos" stays disabled forever.
    if (validated.target_amount !== undefined) {
      const { data: current, error: fetchError } = await insforgeAdmin.database
        .from('savings_goals')
        .select('current_amount')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError
      payload.is_completed = toNumber(current?.current_amount) >= validated.target_amount
    }

    const { data: goal, error } = await insforgeAdmin.database
      .from('savings_goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidateSavings()
    return { success: true, data: normalizeGoal(goal) }
  } catch (error) {
    console.error('Update savings goal error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo actualizar la meta') }
  }
}

export async function deleteSavingsGoal(id: string, userId: string) {
  if (!userId) {
    console.error('deleteSavingsGoal: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { error } = await insforgeAdmin.database
      .from('savings_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    revalidateSavings()
    return { success: true }
  } catch (error) {
    console.error('Delete savings goal error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo eliminar la meta') }
  }
}

/**
 * Adds funds to a goal.
 *
 * InsForge/PostgREST offers no multi-statement transaction, so the writes are
 * ordered cheapest-to-undo first and compensated on failure: the conversion is
 * resolved before anything is written, then the contribution row, then the
 * account balance, then the goal. Each failing step rolls back what preceded
 * it, so a partial failure never reports success.
 */
export async function addFundsToGoal(id: string, userId: string, data: AddFundsInput) {
  if (!userId) {
    console.error('addFundsToGoal: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }

  const parsed = addFundsSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const validated = parsed.data

  try {
    const { data: goalRow, error: fetchError } = await insforgeAdmin.database
      .from('savings_goals')
      .select()
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError
    if (!goalRow) return { success: false, error: 'Meta no encontrada' }

    const goal = normalizeGoal(goalRow)
    const contributionCurrency = validated.currency ?? goal.currency

    // Resolve the conversion BEFORE any write: a missing rate must abort
    // without touching the goal, the contribution or the account.
    const converted = await convertAmount(validated.amount, contributionCurrency, goal.currency)
    if (!converted.ok) {
      return {
        success: false,
        error: `${converted.error}. Actualiza las tasas en Configuración.`,
      }
    }

    const { data: contribution, error: contributionError } = await insforgeAdmin.database
      .from('savings_contributions')
      .insert({
        goal_id: id,
        user_id: userId,
        amount: validated.amount,
        currency: contributionCurrency,
        account_id: validated.account_id ?? null,
      })
      .select()
      .single()

    if (contributionError) throw contributionError

    // Deduct from account balance when an account is specified.
    if (validated.account_id) {
      const balanceError = await applyBalanceDelta(
        validated.account_id,
        validated.amount,
        contributionCurrency,
        'subtract'
      )
      if (balanceError) {
        // Compensate: the contribution row is the only thing written so far.
        await insforgeAdmin.database
          .from('savings_contributions')
          .delete()
          .eq('id', contribution.id)
        console.error('Add funds to goal — balance error:', balanceError)
        return { success: false, error: 'No se pudo descontar el saldo de la cuenta' }
      }
    }

    // No cap: letting `current_amount` exceed the target keeps the goal, the
    // contribution row and the account debit in agreement. The UI clamps the
    // progress bar and shows a "Superada" badge instead.
    const newAmount = goal.current_amount + converted.amount

    const { data: updated, error: updateError } = await insforgeAdmin.database
      .from('savings_goals')
      .update({ current_amount: newAmount, is_completed: newAmount >= goal.target_amount })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      // Compensate both prior writes, in reverse order.
      if (validated.account_id) {
        await applyBalanceDelta(
          validated.account_id,
          validated.amount,
          contributionCurrency,
          'add'
        )
      }
      await insforgeAdmin.database
        .from('savings_contributions')
        .delete()
        .eq('id', contribution.id)
      throw updateError
    }

    revalidateSavings()
    revalidatePath('/settings')
    return { success: true, data: normalizeGoal(updated) }
  } catch (error) {
    console.error('Add funds to goal error:', error)
    return { success: false, error: errorMessage(error, 'No se pudieron añadir los fondos') }
  }
}

export async function setGoalCompleted(id: string, userId: string, completed: boolean) {
  if (!userId) {
    console.error('setGoalCompleted: userId is missing')
    return { success: false, error: 'Falta el identificador de usuario' }
  }
  try {
    const { data: goal, error } = await insforgeAdmin.database
      .from('savings_goals')
      .update({ is_completed: completed })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    revalidateSavings()
    return { success: true, data: normalizeGoal(goal) }
  } catch (error) {
    console.error('Set goal completed error:', error)
    return { success: false, error: errorMessage(error, 'No se pudo actualizar el estado de la meta') }
  }
}

/**
 * Strict conversion preview for the add-funds dialog, so the user sees what
 * will actually land in the goal — including when no rate exists.
 */
export async function previewGoalContribution(
  amount: number,
  from: string,
  to: string
): Promise<{ ok: true; amount: number } | { ok: false; error: string }> {
  return convertAmount(amount, from, to)
}
