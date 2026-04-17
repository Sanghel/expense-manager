'use client'

import { VStack, FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createRecurringTransaction, updateRecurringTransaction } from '@/lib/actions/recurring.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Category, Currency, RecurringTransactionWithCategory } from '@/types/database.types'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  onSuccess: () => void
  initialData?: RecurringTransactionWithCategory
  transactionId?: string
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  currency: 'COP' as Currency,
  category_id: '',
  description: '',
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
}

export function RecurringTransactionForm({
  isOpen,
  onClose,
  userId,
  categories,
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
        amount: String(initialData.amount),
        currency: initialData.currency as Currency,
        category_id: initialData.category_id,
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
      amount: parseFloat(form.amount as string),
      currency: form.currency,
      type: form.type,
      category_id: form.category_id,
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

          <FormInput
            label="Monto"
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
            type="number"
            placeholder="0.00"
            step="0.01"
            required
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

          <FieldRoot required>
            <FieldLabel>Frecuencia</FieldLabel>
            <NativeSelectRoot>
              <NativeSelectField
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as typeof form.frequency })}
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </NativeSelectField>
            </NativeSelectRoot>
          </FieldRoot>

          <FormInput
            label="Fecha de Inicio"
            value={form.start_date}
            onChange={(v) => setForm({ ...form, start_date: v })}
            type="date"
            required
          />

          <FormInput
            label="Fecha de Fin (Opcional)"
            value={form.end_date}
            onChange={(v) => setForm({ ...form, end_date: v })}
            type="date"
          />

          <PrimaryButton type="submit" width="full" loading={loading}>
            {transactionId ? 'Guardar Cambios' : 'Crear Recurrencia'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
