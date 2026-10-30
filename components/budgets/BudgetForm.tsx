'use client'

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Flex, Grid, Input, Stack, Text } from '@chakra-ui/react'
import { LuHistory } from 'react-icons/lu'
import { createBudget, getBudgetContext, updateBudget, type BudgetContext } from '@/lib/actions/budgets.actions'
import { toaster } from '@/lib/toaster'
import { InlineCalendar } from '@/components/ui/InlineCalendar'
import {
  AmountBlock,
  Chip,
  DateField,
  Field,
  FormModal,
  FormModalContent,
  SegmentedControl,
} from '@/components/ui/pulso'
import { toNumber } from '@/lib/utils/numbers'
import { getLocalDateString } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import { CURRENCIES, decimalsFor } from '@/lib/utils/amount-input'
import type { Budget, BudgetAmountType, BudgetScope, Category, Currency } from '@/types/database.types'

/**
 * What the form needs to prefill an edit. The scope/percent fields are
 * optional so callers holding an older, narrower budget shape (the AI
 * suggestions list) still type-check; they default to a fixed category budget.
 */
export type EditableBudget = Pick<Budget, 'id' | 'currency' | 'period' | 'start_date'> &
  Partial<Pick<Budget, 'scope' | 'category_id' | 'group_id' | 'amount_type' | 'amount' | 'percent'>>

const TOP_CATEGORIES = 10
const PERCENT_CHIPS = [5, 10, 15, 20, 30]

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
  onSuccess: () => void
  editingBudget?: EditableBudget | null
  // Pre-fills the create form (e.g. from an AI budget suggestion). Ignored when
  // editingBudget is set.
  prefill?: PrefillBudget | null
  // Scope preseleccionado al CREAR (viene del sub-tab activo). Ignorado al editar.
  defaultScope?: BudgetScope
}

const defaultForm = {
  // No "Grupo": a group's budget is the sum of its categories' budgets.
  scope: 'category' as BudgetScope,
  type: 'expense' as 'income' | 'expense',
  category_id: '',
  amount_type: 'fixed' as BudgetAmountType,
  amount: undefined as number | undefined,
  percent: undefined as number | undefined,
  currency: 'COP' as Currency,
  period: 'monthly' as 'monthly' | 'yearly',
  start_date: getLocalDateString(),
}

function initialForm(categories: Category[], editing?: EditableBudget | null, prefill?: PrefillBudget | null, defaultScope?: BudgetScope) {
  if (editing) {
    const category = categories.find((c) => c.id === editing.category_id)
    return {
      scope: editing.scope ?? 'category',
      type: (category?.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
      category_id: editing.category_id ?? '',
      amount_type: editing.amount_type ?? 'fixed',
      amount: editing.amount == null ? undefined : toNumber(editing.amount),
      percent: editing.percent == null ? undefined : toNumber(editing.percent),
      currency: editing.currency,
      period: editing.period,
      start_date: editing.start_date,
    }
  }
  if (prefill) {
    const category = categories.find((c) => c.id === prefill.category_id)
    return {
      ...defaultForm,
      type: (category?.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
      category_id: prefill.category_id ?? '',
      amount: prefill.amount,
      currency: prefill.currency ?? defaultForm.currency,
    }
  }
  return { ...defaultForm, scope: defaultScope ?? defaultForm.scope }
}

/** "septiembre" from 'YYYY-MM'. */
const monthName = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('es-CO', { month: 'long' })

type BodyProps = Omit<Props, 'isOpen'>

function BudgetFormBody({ onClose, userId, categories, onSuccess, editingBudget, prefill, defaultScope }: BodyProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => initialForm(categories, editingBudget, prefill, defaultScope))
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [context, setContext] = useState<BudgetContext | null>(null)
  // Typed text, so "12," survives until the decimal arrives.
  const [percentText, setPercentText] = useState(() =>
    formData.percent == null ? '' : String(formData.percent).replace('.', ',')
  )
  const setPercent = (text: string) => {
    const clean = text.replace(/[^0-9,]/g, '').replace(/,(?=.*,)/g, '')
    const n = Number(clean.replace(',', '.'))
    setPercentText(clean)
    set({ percent: clean && Number.isFinite(n) && n > 0 ? n : undefined })
  }
  const set = (patch: Partial<typeof formData>) => setFormData((prev) => ({ ...prev, ...patch }))

  // Last month's figures, in the budget's currency.
  useEffect(() => {
    let cancelled = false
    getBudgetContext(userId, formData.currency).then((result) => {
      if (!cancelled && result.success) setContext(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [userId, formData.currency])

  const isPercent = formData.amount_type !== 'fixed'
  const fmt = (n: number) => formatCurrency(n, formData.currency, decimalsFor(formData.currency))

  const typeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === formData.type || c.type === 'both')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, formData.type]
  )
  const selectedCategory = categories.find((c) => c.id === formData.category_id)
  const visibleCategories = useMemo(() => {
    if (showAllCategories) return typeCategories
    const top = typeCategories.slice(0, TOP_CATEGORIES)
    if (selectedCategory && !top.includes(selectedCategory)) top.push(selectedCategory)
    return top
  }, [typeCategories, showAllCategories, selectedCategory])

  // Base of a percent limit, and of the "≈ X% de tus ingresos" line.
  const base = context ? (formData.amount_type === 'percent_expense' ? context.expense : context.income) : 0
  const percentLimit = isPercent && formData.percent && base ? (formData.percent / 100) * base : null

  const history = (() => {
    if (!context) return null
    const month = monthName(context.month)
    if (formData.scope === 'total') return `En ${month} gastaste ${fmt(context.expense)} en total`
    if (!selectedCategory) return null
    const value = context.expenseByCategory[selectedCategory.id] ?? 0
    if (formData.type === 'income') return null
    return value > 0
      ? `En ${month} gastaste ${fmt(value)} en ${selectedCategory.name}`
      : `En ${month} no tuviste gastos en ${selectedCategory.name}`
  })()

  const canSave =
    (formData.scope !== 'category' || !!formData.category_id) &&
    (isPercent ? !!formData.percent && formData.percent > 0 && formData.percent <= 100 : !!formData.amount)

  const handleSubmit = async () => {
    setLoading(true)
    const budgetData = {
      scope: formData.scope,
      category_id: formData.scope === 'category' ? formData.category_id || null : null,
      group_id: null,
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
        title: [
          editingBudget ? 'Presupuesto actualizado' : 'Presupuesto creado',
          formData.scope === 'total' ? 'General' : selectedCategory?.name,
        ]
          .filter(Boolean)
          .join(' · '),
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error al guardar', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  const limitOptions = [
    { value: 'fixed' as const, label: 'Monto fijo' },
    { value: 'percent_income' as const, label: '% ingresos' },
    // 'total' + '% del gasto' is always 100%, so it is not offered.
    ...(formData.scope === 'total' ? [] : [{ value: 'percent_expense' as const, label: '% del gasto' }]),
  ]

  return (
    <FormModalContent
      title={editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={canSave}
      loading={loading}
      submitLabel={
        editingBudget ? (
          'Guardar cambios'
        ) : (
          <>
            Crear presupuesto
            {!isPercent && formData.amount && (
              <Text as="span" fontFamily="mono" fontWeight="500">
                · {fmt(formData.amount)}
              </Text>
            )}
          </>
        )
      }
    >
      <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
        <Field label="Ámbito">
          <SegmentedControl
            label="Ámbito"
            value={formData.scope}
            fullWidth
            onChange={(scope) =>
              set({
                scope,
                category_id: '',
                amount_type: scope === 'total' && formData.amount_type === 'percent_expense' ? 'fixed' : formData.amount_type,
              })
            }
            options={[
              { value: 'category', label: 'Por categoría' },
              { value: 'total', label: 'General' },
            ]}
          />
        </Field>
        {formData.scope === 'category' && (
          <Field label="Tipo">
            <SegmentedControl
              label="Tipo"
              value={formData.type}
              fullWidth
              onChange={(type) => set({ type, category_id: '' })}
              options={[
                { value: 'expense', label: 'Gasto' },
                { value: 'income', label: 'Ingreso' },
              ]}
            />
          </Field>
        )}
      </Grid>

      {formData.scope === 'category' && (
        <Field label="Categoría">
          <Flex wrap="wrap" gap={2}>
            {visibleCategories.map((c) => (
              <Chip key={c.id} selected={formData.category_id === c.id} onClick={() => set({ category_id: c.id })}>
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </Chip>
            ))}
            {typeCategories.length > TOP_CATEGORIES && (
              <Button
                onClick={() => setShowAllCategories((v) => !v)}
                h="36px"
                px={3.5}
                fontSize="13px"
                variant="ghost"
                color="text2"
              >
                {showAllCategories ? 'Ver menos' : 'Ver todas'}
              </Button>
            )}
          </Flex>
        </Field>
      )}

      <Field label="Límite">
        <SegmentedControl
          label="Tipo de límite"
          value={formData.amount_type}
          fullWidth
          onChange={(amount_type) => {
            set({ amount_type, amount: undefined, percent: undefined })
            setPercentText('')
          }}
          options={limitOptions}
        />
        <Box mt={3}>
          {isPercent ? (
            <Stack align="center" gap={3} bg="bg" borderRadius="20px" px={3} py="18px">
              <CurrencyPills value={formData.currency} onChange={(currency) => set({ currency })} />
              <Flex align="baseline" justify="center">
                <Input
                  value={percentText}
                  onChange={(e) => setPercent(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  aria-label="Porcentaje"
                  variant="flushed"
                  bg="transparent"
                  borderBottomWidth="0"
                  _focusVisible={{ boxShadow: 'none' }}
                  w={`${Math.max(percentText.length, 1) + 0.5}ch`}
                  h="auto"
                  px={0}
                  textAlign="right"
                  fontFamily="mono"
                  fontSize="44px"
                  fontWeight="500"
                  letterSpacing="-0.04em"
                  lineHeight="1"
                  _placeholder={{ color: 'text3' }}
                />
                <Text as="span" fontFamily="mono" fontSize="28px" color="text3" ms={1}>
                  %
                </Text>
              </Flex>
              <Flex wrap="wrap" gap={2} justify="center">
                {PERCENT_CHIPS.map((p) => (
                  <Chip
                    key={p}
                    selected={formData.percent === p}
                    onClick={() => setPercent(String(p))}
                    h="32px"
                    fontFamily="mono"
                    fontSize="12px"
                  >
                    {p}%
                  </Chip>
                ))}
              </Flex>
              <Text fontFamily="mono" fontSize="12px" color="text3" textAlign="center">
                {formData.percent && formData.percent > 100
                  ? 'El porcentaje no puede pasar de 100%'
                  : percentLimit != null && context
                  ? `≈ ${fmt(percentLimit)} / mes según ${monthName(context.month)}`
                  : formData.amount_type === 'percent_income'
                    ? 'El límite se recalcula cada periodo según tus ingresos'
                    : 'El límite se recalcula cada periodo según tu gasto'}
              </Text>
            </Stack>
          ) : (
            <AmountBlock
              amount={formData.amount}
              currency={formData.currency}
              onAmountChange={(amount) => set({ amount })}
              onCurrencyChange={(currency) => set({ currency })}
              label="Monto del presupuesto"
              footer={
                formData.amount && context && context.income > 0 ? (
                  <Text fontFamily="mono" fontSize="12px" color="text3">
                    ≈ {Math.round((formData.amount / context.income) * 100)}% de tus ingresos de {monthName(context.month)}
                  </Text>
                ) : undefined
              }
            />
          )}
        </Box>
        {history && (
          <Flex align="center" gap={2} mt={3} fontSize="13px" color="text2">
            <LuHistory />
            <Text>{history}</Text>
          </Flex>
        )}
      </Field>

      <Box>
        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
          <Field label="Periodo">
            <SegmentedControl
              label="Periodo"
              value={formData.period}
              variant="field"
              fullWidth
              onChange={(period) => set({ period })}
              options={[
                { value: 'monthly', label: 'Mensual' },
                { value: 'yearly', label: 'Anual' },
              ]}
            />
          </Field>
          <Field label="Empieza">
            <DateField
              value={formData.start_date}
              onChange={(start_date) => set({ start_date })}
              open={calendarOpen}
              onOpenChange={setCalendarOpen}
              inlineCalendar={false}
            />
          </Field>
        </Grid>
        {calendarOpen && (
          <Box mt={3}>
            <InlineCalendar
              value={formData.start_date}
              disableFuture={false}
              onChange={(start_date) => {
                set({ start_date })
                setCalendarOpen(false)
              }}
            />
          </Box>
        )}
      </Box>
    </FormModalContent>
  )
}

/** Mono currency pills, same look as the amount block's. */
function CurrencyPills({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <Flex gap={1} role="radiogroup" aria-label="Moneda">
      {CURRENCIES.map((c) => (
        <Button
          key={c}
          role="radio"
          aria-checked={value === c}
          onClick={() => onChange(c)}
          size="2xs"
          px={2.5}
          fontFamily="mono"
          fontSize="11px"
          bg={value === c ? 'text' : 'transparent'}
          color={value === c ? 'bg' : 'text3'}
          _hover={{ color: value === c ? 'bg' : 'text' }}
        >
          {c}
        </Button>
      ))}
    </Flex>
  )
}

/** Pulso "Nuevo presupuesto" / "Editar presupuesto" (same modal, `editingBudget` for edit). */
export function BudgetForm({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
    >
      <BudgetFormBody {...props} />
    </FormModal>
  )
}
