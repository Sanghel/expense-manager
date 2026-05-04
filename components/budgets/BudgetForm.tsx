'use client'

import { VStack, HStack } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createBudget, updateBudget } from '@/lib/actions/budgets.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { DateInput } from '@/components/ui/DateInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CancelButton } from '@/components/ui/CancelButton'
import type { Category, Currency } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

interface Budget {
  id: string
  category_id: string
  amount: number
  currency: Currency
  period: 'monthly' | 'yearly'
  start_date: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  onSuccess: () => void
  editingBudget?: Budget | null
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  category_id: '',
  amount: undefined as number | undefined,
  currency: 'COP' as Currency,
  period: 'monthly' as 'monthly' | 'yearly',
  start_date: getLocalDateString(),
}

export function BudgetForm({ isOpen, onClose, userId, categories, onSuccess, editingBudget }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        const category = categories.find((c) => c.id === editingBudget.category_id)
        setFormData({
          type: (category?.type || 'expense') as 'income' | 'expense',
          category_id: editingBudget.category_id,
          amount: Number(editingBudget.amount) as number | undefined,
          currency: editingBudget.currency,
          period: editingBudget.period,
          start_date: editingBudget.start_date,
        })
      } else {
        setFormData(defaultForm)
      }
    }
  }, [isOpen, editingBudget, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.category_id) {
      toaster.create({ title: 'Error', description: 'Debes seleccionar una categoría', type: 'error', duration: 3000 })
      setLoading(false)
      return
    }

    const budgetData = {
      category_id: formData.category_id,
      amount: formData.amount ?? 0,
      currency: formData.currency,
      period: formData.period,
      start_date: formData.start_date,
    }

    const result = editingBudget
      ? await updateBudget(editingBudget.id, userId, budgetData)
      : await createBudget(userId, budgetData)

    if (result.success) {
      toaster.create({
        title: editingBudget ? 'Presupuesto actualizado' : 'Presupuesto creado',
        type: 'success',
        duration: 3000,
      })
      onSuccess()
      onClose()
      setFormData(defaultForm)
    } else {
      toaster.create({ title: 'Error al guardar', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <RadioSelect
            label="Tipo"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v as 'income' | 'expense', category_id: '' })}
            options={TYPE_OPTIONS}
            required
          />

          <CategorySelect
            value={formData.category_id}
            onChange={(v) => setFormData({ ...formData, category_id: v })}
            categories={categories}
            filterByType={formData.type}
            required
          />

          <InputAmount
            label="Monto del Presupuesto"
            value={formData.amount}
            onChange={(v) => setFormData({ ...formData, amount: v })}
            isRequired
          />

          <CurrencySelect
            value={formData.currency}
            onChange={(v) => setFormData({ ...formData, currency: v })}
            required
          />

          <RadioSelect
            label="Periodo"
            value={formData.period}
            onChange={(v) => setFormData({ ...formData, period: v as 'monthly' | 'yearly' })}
            options={PERIOD_OPTIONS}
            required
          />

          <DateInput
            label="Fecha de Inicio"
            value={formData.start_date}
            onChange={(v) => setFormData({ ...formData, start_date: v })}
            required
          />

          <HStack gap={4} pt={4} w="full" justifyContent="flex-end">
            <CancelButton onClick={onClose} />
            <PrimaryButton type="submit" loading={loading}>
              {editingBudget ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </PrimaryButton>
          </HStack>
        </VStack>
      </form>
    </FormDialog>
  )
}
