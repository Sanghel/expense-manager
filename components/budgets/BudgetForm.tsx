'use client'

import { VStack, HStack } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { createBudget, updateBudget } from '@/lib/actions/budgets.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { DateInput } from '@/components/ui/DateInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { InputPercent } from '@/components/ui/InputPercent'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { CategoryGroupSelect } from '@/components/ui/CategoryGroupSelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CancelButton } from '@/components/ui/CancelButton'
import { toNumber } from '@/lib/utils/numbers'
import { getLocalDateString } from '@/lib/utils/dates'
import type {
  Budget,
  BudgetAmountType,
  BudgetScope,
  CategoryGroupWithMembers,
  Category,
  Currency,
} from '@/types/database.types'

/**
 * What the form needs to prefill an edit. The scope/percent fields are
 * optional so callers holding an older, narrower budget shape (the AI
 * suggestions list) still type-check; they default to a fixed category budget.
 */
export type EditableBudget = Pick<Budget, 'id' | 'currency' | 'period' | 'start_date'> &
  Partial<Pick<Budget, 'scope' | 'category_id' | 'group_id' | 'amount_type' | 'amount' | 'percent'>>

const SCOPE_OPTIONS = [
  { value: 'category', label: 'Categoría' },
  { value: 'group', label: 'Grupo' },
  { value: 'total', label: 'General' },
]

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

const AMOUNT_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Monto fijo' },
  { value: 'percent_income', label: '% de ingresos' },
  { value: 'percent_expense', label: '% del gasto' },
]

interface PrefillBudget {
  category_id?: string
  amount?: number
  currency?: Currency
}

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  groups?: CategoryGroupWithMembers[]
  onSuccess: () => void
  editingBudget?: EditableBudget | null
  // Pre-fills the create form (e.g. from an AI budget suggestion). Ignored when
  // editingBudget is set.
  prefill?: PrefillBudget | null
}

const defaultForm = {
  scope: 'category' as BudgetScope,
  type: 'expense' as 'income' | 'expense',
  category_id: '',
  group_id: '',
  amount_type: 'fixed' as BudgetAmountType,
  amount: undefined as number | undefined,
  percent: undefined as number | undefined,
  currency: 'COP' as Currency,
  period: 'monthly' as 'monthly' | 'yearly',
  start_date: getLocalDateString(),
}

export function BudgetForm({
  isOpen,
  onClose,
  userId,
  categories,
  groups = [],
  onSuccess,
  editingBudget,
  prefill,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        const category = categories.find((c) => c.id === editingBudget.category_id)
        setFormData({
          scope: editingBudget.scope ?? 'category',
          type: (category?.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
          category_id: editingBudget.category_id ?? '',
          group_id: editingBudget.group_id ?? '',
          amount_type: editingBudget.amount_type ?? 'fixed',
          amount: editingBudget.amount === null ? undefined : toNumber(editingBudget.amount),
          percent: editingBudget.percent === null ? undefined : toNumber(editingBudget.percent),
          currency: editingBudget.currency,
          period: editingBudget.period,
          start_date: editingBudget.start_date,
        })
      } else if (prefill) {
        const category = categories.find((c) => c.id === prefill.category_id)
        setFormData({
          ...defaultForm,
          type: category?.type === 'income' ? 'income' : 'expense',
          category_id: prefill.category_id ?? '',
          amount: prefill.amount,
          currency: prefill.currency ?? defaultForm.currency,
        })
      } else {
        setFormData(defaultForm)
      }
    }
  }, [isOpen, editingBudget, prefill, categories])

  const isPercent = formData.amount_type !== 'fixed'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const budgetData = {
      scope: formData.scope,
      category_id: formData.scope === 'category' ? formData.category_id || null : null,
      group_id: formData.scope === 'group' ? formData.group_id || null : null,
      amount_type: formData.amount_type,
      amount: isPercent ? null : (formData.amount ?? null),
      percent: isPercent ? (formData.percent ?? null) : null,
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
            label="Ámbito"
            value={formData.scope}
            onChange={(v) =>
              setFormData({
                ...formData,
                scope: v as BudgetScope,
                category_id: '',
                group_id: '',
                // 'total' + '% del gasto' is always 100%, so it is not offered.
                amount_type:
                  v === 'total' && formData.amount_type === 'percent_expense'
                    ? 'fixed'
                    : formData.amount_type,
              })
            }
            options={SCOPE_OPTIONS}
            required
          />

          {formData.scope === 'category' && (
            <>
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
            </>
          )}

          {formData.scope === 'group' && (
            <CategoryGroupSelect
              value={formData.group_id}
              onChange={(v) => setFormData({ ...formData, group_id: v })}
              groups={groups}
              required
            />
          )}

          <RadioSelect
            label="Tipo de límite"
            value={formData.amount_type}
            onChange={(v) =>
              setFormData({
                ...formData,
                amount_type: v as BudgetAmountType,
                amount: undefined,
                percent: undefined,
              })
            }
            options={
              formData.scope === 'total'
                ? AMOUNT_TYPE_OPTIONS.filter((o) => o.value !== 'percent_expense')
                : AMOUNT_TYPE_OPTIONS
            }
            required
          />

          {isPercent ? (
            <InputPercent
              label={
                formData.amount_type === 'percent_income'
                  ? 'Porcentaje de los ingresos del periodo'
                  : 'Porcentaje del gasto del periodo'
              }
              value={formData.percent}
              onChange={(v) => setFormData({ ...formData, percent: v })}
              helperText="El límite se recalcula cada periodo según lo que ingreses o gastes."
              isRequired
            />
          ) : (
            <InputAmount
              label="Monto del Presupuesto"
              value={formData.amount}
              onChange={(v) => setFormData({ ...formData, amount: v })}
              isRequired
            />
          )}

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
