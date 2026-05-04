'use client'

import { VStack } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createRecurringTransaction, updateRecurringTransaction } from '@/lib/actions/recurring.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { DateInput } from '@/components/ui/DateInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { FrequencySelect } from '@/components/ui/FrequencySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Account, Category, Currency, RecurringTransactionWithCategory } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  accounts: Account[]
  onSuccess: () => void
  initialData?: RecurringTransactionWithCategory
  transactionId?: string
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  amount: undefined as number | undefined,
  currency: 'COP' as Currency,
  category_id: '',
  account_id: '',
  description: '',
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  start_date: getLocalDateString(),
  end_date: '',
}

export function RecurringTransactionForm({
  isOpen,
  onClose,
  userId,
  categories,
  accounts,
  onSuccess,
  initialData,
  transactionId,
}: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type,
        amount: Number(initialData.amount) as number | undefined,
        currency: initialData.currency as Currency,
        category_id: initialData.category_id,
        account_id: initialData.account_id ?? '',
        description: initialData.description,
        frequency: initialData.frequency,
        start_date: initialData.start_date,
        end_date: initialData.end_date ?? '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [initialData])

  const handleSubmit = async () => {
    if (!form.amount || !form.category_id || !form.description) {
      toaster.create({ title: 'Por favor completa todos los campos requeridos', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const payload = {
      amount: form.amount ?? 0,
      currency: form.currency,
      type: form.type,
      category_id: form.category_id,
      account_id: form.account_id || null,
      description: form.description,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
    }

    const result = transactionId
      ? await updateRecurringTransaction(transactionId, userId, payload)
      : await createRecurringTransaction(userId, payload)

    setLoading(false)

    if (result.success) {
      toaster.create({
        title: transactionId ? 'Recurrente actualizada' : 'Transacción recurrente creada',
        type: 'success',
        duration: 3000,
      })
      if (!transactionId) setForm(defaultForm)
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: 'Error al guardar', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={transactionId ? 'Editar Recurrente' : 'Nueva Transacción Recurrente'}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <VStack gap="4">
          <RadioSelect
            label="Tipo"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v as 'income' | 'expense', category_id: '' })}
            options={TYPE_OPTIONS}
            required
          />

          <InputAmount
            label="Monto"
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
            isRequired
          />

          <CurrencySelect
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
          />

          <CategorySelect
            value={form.category_id}
            onChange={(v) => setForm({ ...form, category_id: v })}
            categories={categories}
            filterByType={form.type}
            required
          />

          <FormInput
            label="Descripción"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Ej: Suscripción Netflix"
            required
          />

          {accounts.length > 0 && (
            <AccountSelect
              value={form.account_id}
              onChange={(v) => setForm({ ...form, account_id: v })}
              accounts={accounts}
              label="Cuenta asociada"
              optional
            />
          )}

          <FrequencySelect
            value={form.frequency}
            onChange={(v) => setForm({ ...form, frequency: v })}
            required
          />

          <DateInput
            label="Fecha de Inicio"
            value={form.start_date}
            onChange={(v) => setForm({ ...form, start_date: v })}
            required
          />

          <DateInput
            label="Fecha de Fin"
            value={form.end_date}
            onChange={(v) => setForm({ ...form, end_date: v })}
            optional
          />

          <PrimaryButton type="submit" width="full" loading={loading}>
            {transactionId ? 'Guardar Cambios' : 'Crear Recurrencia'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
