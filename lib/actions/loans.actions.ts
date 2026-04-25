'use server'

import { insforgeAdmin } from '@/lib/insforge-admin'
import { applyBalanceDelta } from '@/lib/utils/balance-updater'
import { loanSchema, type LoanFormData } from '@/lib/validations/loan'
import { revalidatePath } from 'next/cache'

export async function getLoans(userId: string) {
  const { data, error } = await insforgeAdmin.database
    .from('loans')
    .select('*, account:accounts(id, name, currency, icon)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createLoan(userId: string, input: LoanFormData) {
  const parsed = loanSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { person_name, amount, currency, account_id, type, notes } = parsed.data

  const { data, error } = await insforgeAdmin.database
    .from('loans')
    .insert({ user_id: userId, person_name, amount, currency, account_id, type, notes })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // lent = money leaves my account; borrowed = money enters my account
  if (account_id) {
    await applyBalanceDelta(account_id, amount, currency, type === 'lent' ? 'subtract' : 'add')
  }

  revalidatePath('/loans')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateLoan(userId: string, loanId: string, input: LoanFormData) {
  const parsed = loanSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: old, error: fetchErr } = await insforgeAdmin.database
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !old) return { success: false, error: 'Préstamo no encontrado' }
  if (old.status === 'settled') return { success: false, error: 'No se puede editar un préstamo saldado' }

  // Reverse old balance effect
  if (old.account_id) {
    await applyBalanceDelta(
      old.account_id,
      old.amount,
      old.currency,
      old.type === 'lent' ? 'add' : 'subtract'
    )
  }

  const { person_name, amount, currency, account_id, type, notes } = parsed.data

  // Apply new balance effect
  if (account_id) {
    await applyBalanceDelta(account_id, amount, currency, type === 'lent' ? 'subtract' : 'add')
  }

  const { data, error } = await insforgeAdmin.database
    .from('loans')
    .update({ person_name, amount, currency, account_id, type, notes, updated_at: new Date().toISOString() })
    .eq('id', loanId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/loans')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function deleteLoan(userId: string, loanId: string) {
  const { data: loan, error: fetchErr } = await insforgeAdmin.database
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !loan) return { success: false, error: 'Préstamo no encontrado' }

  // Only reverse balance if loan is still active
  if (loan.status === 'active' && loan.account_id) {
    await applyBalanceDelta(
      loan.account_id,
      loan.amount,
      loan.currency,
      loan.type === 'lent' ? 'add' : 'subtract'
    )
  }

  const { error } = await insforgeAdmin.database
    .from('loans')
    .delete()
    .eq('id', loanId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/loans')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function addLoanPayment(
  userId: string,
  loanId: string,
  paymentAmount: number
) {
  const { data: loan, error: fetchErr } = await insforgeAdmin.database
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !loan) return { success: false, error: 'Préstamo no encontrado' }
  if (loan.status === 'settled') return { success: false, error: 'El préstamo ya está saldado' }

  const currentPaid = Number(loan.paid_amount ?? 0)
  const newPaid = currentPaid + paymentAmount
  const loanAmount = Number(loan.amount)

  // Apply balance delta: lent = I got partial payment back (add); borrowed = I paid partial (subtract)
  if (loan.account_id) {
    await applyBalanceDelta(
      loan.account_id,
      paymentAmount,
      loan.currency,
      loan.type === 'lent' ? 'add' : 'subtract'
    )
  }

  if (newPaid >= loanAmount) {
    // Fully settled via partial payments
    const { error } = await insforgeAdmin.database
      .from('loans')
      .update({
        paid_amount: loanAmount,
        status: 'settled',
        settled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await insforgeAdmin.database
      .from('loans')
      .update({
        paid_amount: newPaid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/loans')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  return { success: true, settled: newPaid >= loanAmount }
}

export async function settleLoan(userId: string, loanId: string) {
  const { data: loan, error: fetchErr } = await insforgeAdmin.database
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !loan) return { success: false, error: 'Préstamo no encontrado' }
  if (loan.status === 'settled') return { success: false, error: 'Ya está saldado' }

  // lent settled = I got paid back → add money back
  // borrowed settled = I paid back → subtract money
  if (loan.account_id) {
    await applyBalanceDelta(
      loan.account_id,
      loan.amount,
      loan.currency,
      loan.type === 'lent' ? 'add' : 'subtract'
    )
  }

  const { error } = await insforgeAdmin.database
    .from('loans')
    .update({
      status: 'settled',
      settled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', loanId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/loans')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  return { success: true }
}
