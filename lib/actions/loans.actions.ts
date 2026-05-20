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

export async function getLoanPayments(userId: string, loanId: string) {
  const { data, error } = await insforgeAdmin.database
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function deleteLoanPayment(userId: string, paymentId: string) {
  const { data: payment, error: fetchErr } = await insforgeAdmin.database
    .from('loan_payments')
    .select('*, loan:loans(*)')
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single()

  if (fetchErr || !payment) return { success: false, error: 'Pago no encontrado' }

  const loan = payment.loan
  if (!loan) return { success: false, error: 'Deuda no encontrada' }

  // Reverse balance: payment was subtracted/added before — reverse it
  if (loan.account_id) {
    await applyBalanceDelta(
      loan.account_id,
      payment.amount,
      payment.currency,
      loan.type === 'lent' ? 'subtract' : 'add'
    )
  }

  // Decrease paid_amount on loan
  const newPaid = Math.max(0, Number(loan.paid_amount) - Number(payment.amount))
  await insforgeAdmin.database
    .from('loans')
    .update({ paid_amount: newPaid, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', loan.id)
    .eq('user_id', userId)

  const { error } = await insforgeAdmin.database
    .from('loan_payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/loans')
  revalidatePath('/dashboard')
  return { success: true }
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
  paymentAmount: number,
  paymentDate?: string,
  paymentNotes?: string
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

  // Apply balance delta
  if (loan.account_id) {
    await applyBalanceDelta(
      loan.account_id,
      paymentAmount,
      loan.currency,
      loan.type === 'lent' ? 'add' : 'subtract'
    )
  }

  // Insert payment record
  await insforgeAdmin.database
    .from('loan_payments')
    .insert({
      loan_id: loanId,
      user_id: userId,
      amount: paymentAmount,
      currency: loan.currency,
      date: paymentDate ?? new Date().toISOString().split('T')[0],
      notes: paymentNotes ?? null,
    })

  const isSettled = newPaid >= loanAmount

  const { error } = await insforgeAdmin.database
    .from('loans')
    .update({
      paid_amount: isSettled ? loanAmount : newPaid,
      status: isSettled ? 'settled' : 'active',
      ...(isSettled ? { settled_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', loanId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/loans')
  revalidatePath('/movimientos')
  revalidatePath('/dashboard')
  return { success: true, settled: isSettled }
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

  const remaining = Number(loan.amount) - Number(loan.paid_amount ?? 0)

  // lent settled = I got paid back → add money back
  // borrowed settled = I paid back → subtract money
  if (loan.account_id && remaining > 0) {
    await applyBalanceDelta(
      loan.account_id,
      remaining,
      loan.currency,
      loan.type === 'lent' ? 'add' : 'subtract'
    )
  }

  // Insert final payment record for the remaining amount
  if (remaining > 0) {
    await insforgeAdmin.database
      .from('loan_payments')
      .insert({
        loan_id: loanId,
        user_id: userId,
        amount: remaining,
        currency: loan.currency,
        date: new Date().toISOString().split('T')[0],
        notes: 'Saldo final',
      })
  }

  const { error } = await insforgeAdmin.database
    .from('loans')
    .update({
      paid_amount: Number(loan.amount),
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
