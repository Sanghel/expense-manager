'use client'

import { VStack } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createSavingsGoal, updateSavingsGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { DateInput } from '@/components/ui/DateInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Currency, SavingsGoal } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
  initialData?: SavingsGoal
  goalId?: string
}

const defaultForm = {
  name: '',
  target_amount: undefined as number | undefined,
  currency: 'COP' as Currency,
  deadline: '',
}

export function SavingsGoalForm({ isOpen, onClose, userId, onSuccess, initialData, goalId }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        target_amount: Number(initialData.target_amount) as number | undefined,
        currency: initialData.currency,
        deadline: initialData.deadline ?? '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [initialData])

  const handleSubmit = async () => {
    if (!form.name || !form.target_amount) {
      toaster.create({ title: 'Por favor completa los campos requeridos', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const payload = {
      name: form.name,
      target_amount: form.target_amount ?? 0,
      currency: form.currency,
      deadline: form.deadline || undefined,
    }

    const result = goalId
      ? await updateSavingsGoal(goalId, userId, payload)
      : await createSavingsGoal(userId, payload)

    setLoading(false)

    if (result.success) {
      toaster.create({
        title: goalId ? 'Meta actualizada' : 'Meta de ahorro creada',
        type: 'success',
        duration: 3000,
      })
      if (!goalId) setForm(defaultForm)
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
      title={goalId ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <VStack gap="4">
          <FormInput
            label="Nombre de la Meta"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Ej: Vacaciones"
            required
          />

          <InputAmount
            label="Monto Objetivo"
            value={form.target_amount}
            onChange={(v) => setForm({ ...form, target_amount: v })}
            isRequired
          />

          <CurrencySelect
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
          />

          <DateInput
            label="Fecha Límite"
            value={form.deadline}
            onChange={(v) => setForm({ ...form, deadline: v })}
            optional
          />

          <PrimaryButton type="submit" width="full" loading={loading}>
            {goalId ? 'Guardar Cambios' : 'Crear Meta'}
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
