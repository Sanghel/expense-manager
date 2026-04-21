import { insforgeAdmin } from '@/lib/insforge-admin'

function getNextDate(lastDate: Date, frequency: string): Date {
  const date = new Date(lastDate)
  switch (frequency) {
    case 'daily':  date.setDate(date.getDate() + 1); break
    case 'weekly': date.setDate(date.getDate() + 7); break
    case 'monthly': date.setMonth(date.getMonth() + 1); break
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break
  }
  return date
}

export async function generateRecurringForUser(userId: string): Promise<{
  generated: number
  skipped: number
  errors: string[]
}> {
  const today = new Date().toISOString().split('T')[0]
  const errors: string[] = []
  let generated = 0
  let skipped = 0

  // Fetch: active, no end_date, start_date <= today
  const { data: noEndDate, error: err1 } = await insforgeAdmin.database
    .from('recurring_transactions')
    .select()
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('end_date', null)
    .lte('start_date', today)

  // Fetch: active, end_date >= today, start_date <= today
  const { data: withEndDate, error: err2 } = await insforgeAdmin.database
    .from('recurring_transactions')
    .select()
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('end_date', today)
    .lte('start_date', today)

  if (err1) { errors.push(`fetch-no-end-date: ${JSON.stringify(err1)}`); return { generated, skipped, errors } }
  if (err2) { errors.push(`fetch-with-end-date: ${JSON.stringify(err2)}`); return { generated, skipped, errors } }

  const recurringList = [...(noEndDate ?? []), ...(withEndDate ?? [])]

  for (const recurring of recurringList) {
    const nextDate = recurring.last_generated
      ? getNextDate(new Date(recurring.last_generated), recurring.frequency)
      : new Date(recurring.start_date)

    const nextDateStr = nextDate.toISOString().split('T')[0]

    if (nextDateStr > today) {
      skipped++
      console.log(`[recurring-gen] skip id=${recurring.id} nextDate=${nextDateStr} is in the future`)
      continue
    }

    console.log(`[recurring-gen] inserting id=${recurring.id} date=${nextDateStr}`)

    const { error: insertError } = await insforgeAdmin.database
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: recurring.amount,
        currency: recurring.currency,
        type: recurring.type,
        category_id: recurring.category_id,
        account_id: recurring.account_id ?? null,
        description: recurring.description,
        date: nextDateStr,
        source: 'manual',
      }])

    if (insertError) {
      const msg = `insert-error id=${recurring.id}: ${JSON.stringify(insertError)}`
      console.error(`[recurring-gen] ${msg}`)
      errors.push(msg)
      continue
    }

    if (recurring.account_id) {
      const rpcName = recurring.type === 'income' ? 'increment_account_balance' : 'decrement_account_balance'
      const { error: rpcError } = await insforgeAdmin.database.rpc(rpcName, {
        account_id: recurring.account_id,
        amount: recurring.amount,
      })
      if (rpcError) {
        const msg = `balance-rpc-error id=${recurring.id}: ${JSON.stringify(rpcError)}`
        console.error(`[recurring-gen] ${msg}`)
        errors.push(msg)
      }
    }

    const { error: updateError } = await insforgeAdmin.database
      .from('recurring_transactions')
      .update({ last_generated: nextDateStr })
      .eq('id', recurring.id)

    if (updateError) {
      const msg = `update-last-generated id=${recurring.id}: ${JSON.stringify(updateError)}`
      console.error(`[recurring-gen] ${msg}`)
      errors.push(msg)
      continue
    }

    generated++
  }

  return { generated, skipped, errors }
}
