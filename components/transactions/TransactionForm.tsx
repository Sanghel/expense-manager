'use client'

import { useMemo, useState } from 'react'
import { Box, Button, Grid, Input, Text, Textarea } from '@chakra-ui/react'
import { LuArrowDownLeft, LuArrowUpRight, LuPlus, LuSparkles } from 'react-icons/lu'
import { createTransaction, updateTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { openAiChat } from '@/lib/ai-chat'
import { InlineCalendar } from '@/components/ui/InlineCalendar'
import {
  AccountChips,
  AmountBlock,
  Chip,
  DateField,
  Field,
  FormModal,
  FormModalContent,
  SegmentedControl,
} from '@/components/ui/pulso'
import { CategoryForm } from '@/components/categories/CategoryForm'
import type { Account, Category, Currency, Transaction, TransactionType } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'

export interface TransactionFormValues {
  type: TransactionType
  amount: number
  currency: Currency
  category_id: string
  account_id: string | null
  description: string
  date: string
  notes: string
}

const TOP_CATEGORIES = 8

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  accounts?: Account[]
  onSuccess: () => void
  initialDate?: string
  lockedDate?: boolean
  prefillDescription?: string
  prefillCategoryId?: string
  initialType?: 'income' | 'expense'
  /** Past transactions, used to show the most frequent categories first. */
  history?: { category_id: string | null }[]
  /** Edit mode: the same modal, prefilled, saving with `updateTransaction`. */
  transaction?: Pick<
    Transaction,
    'id' | 'type' | 'amount' | 'currency' | 'category_id' | 'account_id' | 'description' | 'date' | 'notes'
  >
  /** Hand the values back instead of saving (Gmail review edits a row in memory). */
  onSubmitOverride?: (values: TransactionFormValues) => void
}

const defaultForm = {
  type: 'expense' as TransactionType,
  amount: undefined as number | undefined,
  currency: 'COP' as Currency,
  category_id: '',
  account_id: '',
  description: '',
  date: getLocalDateString(),
  notes: '',
}

type BodyProps = Omit<Props, 'isOpen'>

/**
 * The form itself. The dialog unmounts it on close, so every opening starts
 * from a clean state built from the props (no reset effect needed).
 */
function TransactionFormBody({
  onClose,
  userId,
  categories,
  accounts = [],
  onSuccess,
  initialDate,
  lockedDate,
  prefillDescription,
  prefillCategoryId,
  initialType,
  history = [],
  transaction,
  onSubmitOverride,
}: BodyProps) {
  const isEdit = !!transaction
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() =>
    transaction
      ? {
          type: transaction.type,
          amount: Number(transaction.amount) || undefined,
          currency: transaction.currency as Currency,
          category_id: transaction.category_id ?? '',
          account_id: transaction.account_id ?? '',
          description: transaction.description,
          date: transaction.date,
          notes: transaction.notes ?? '',
        }
      : {
          ...defaultForm,
          type: initialType ?? defaultForm.type,
          date: initialDate ?? getLocalDateString(),
          description: prefillDescription ?? '',
          category_id: prefillCategoryId ?? '',
        }
  )
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isExpense = formData.type === 'expense'

  // Categories of the current type, most used first.
  const typeCategories = useMemo(() => {
    const usage = new Map<string, number>()
    for (const t of history) {
      if (t.category_id) usage.set(t.category_id, (usage.get(t.category_id) ?? 0) + 1)
    }
    return localCategories
      .filter((c) => c.type === formData.type || c.type === 'both')
      .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name))
  }, [localCategories, formData.type, history])

  const selectedCategory = localCategories.find((c) => c.id === formData.category_id)
  const visibleCategories = useMemo(() => {
    if (showAllCategories) return typeCategories
    const top = typeCategories.slice(0, TOP_CATEGORIES)
    // Keep a selected (or prefilled) category visible even if it isn't a top one.
    if (selectedCategory && !top.some((c) => c.id === selectedCategory.id)) top.push(selectedCategory)
    return top
  }, [typeCategories, showAllCategories, selectedCategory])

  const selectedAccount = accounts.find((a) => a.id === formData.account_id)
  const cardOverLimit =
    isExpense &&
    selectedAccount?.type === 'card' &&
    formData.amount != null &&
    formData.amount > (selectedAccount.balance ?? 0)

  const canSave = !!formData.amount && !!formData.category_id && !!formData.date

  const setType = (type: TransactionType) =>
    setFormData((prev) => ({ ...prev, type, category_id: '' }))

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    setFormData((prev) => ({
      ...prev,
      account_id: accountId,
      currency: account ? (account.currency as Currency) : prev.currency,
    }))
  }

  const handleCategoryCreated = (newCategory: Category) => {
    setLocalCategories((prev) => [...prev, newCategory])
    setFormData((prev) => ({ ...prev, category_id: newCategory.id }))
  }

  const handleSubmit = async () => {
    const values: TransactionFormValues = {
      ...formData,
      amount: formData.amount ?? 0,
      account_id: formData.account_id || null,
      // The description is required by the schema; the category name is a
      // sensible default when the user leaves it empty.
      description: formData.description.trim() || selectedCategory?.name || 'Transacción',
    }

    if (onSubmitOverride) {
      onSubmitOverride(values)
      onSuccess()
      onClose()
      return
    }

    setLoading(true)
    const result = transaction
      ? await updateTransaction(transaction.id, userId, values)
      : await createTransaction(userId, values)

    if (result.success) {
      toaster.create({
        title: [
          isEdit ? 'Transacción actualizada' : isExpense ? 'Gasto registrado' : 'Ingreso registrado',
          selectedCategory?.name,
          formatCurrency(formData.amount ?? 0, formData.currency, decimalsFor(formData.currency)),
        ]
          .filter(Boolean)
          .join(' · '),
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: isEdit ? 'Error al actualizar' : 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  const amountLabel = formData.amount
    ? formatCurrency(formData.amount, formData.currency, decimalsFor(formData.currency))
    : null

  return (
    <FormModalContent
      title={isEdit ? 'Editar transacción' : 'Nueva transacción'}
      onClose={onClose}
      header={
        <SegmentedControl
          label="Tipo"
          value={formData.type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Gasto', icon: LuArrowUpRight, tone: 'neg' },
            { value: 'income', label: 'Ingreso', icon: LuArrowDownLeft, tone: 'pos' },
          ]}
        />
      }
      onSubmit={handleSubmit}
      canSubmit={canSave}
      loading={loading}
      submitLabel={
        <>
          {isEdit ? 'Guardar cambios' : isExpense ? 'Guardar gasto' : 'Guardar ingreso'}
          {amountLabel && (
            <Text as="span" fontFamily="mono" fontWeight="500">
              · {amountLabel}
            </Text>
          )}
        </>
      }
      footerStart={
        !isEdit && (
        <Button
          variant="ghost"
          color="brand"
          px={2}
          gap={1.5}
          fontSize="13px"
          onClick={() => {
            onClose()
            openAiChat()
          }}
        >
          <LuSparkles />
          Mejor díctalo
        </Button>
        )
      }
      overlays={
        <CategoryForm
          isOpen={quickCategoryOpen}
          onClose={() => setQuickCategoryOpen(false)}
          userId={userId}
          defaultType={formData.type}
          lockType
          onCreated={handleCategoryCreated}
        />
      }
    >
      <AmountBlock
        variant="bare"
        amount={formData.amount}
        currency={formData.currency}
        onAmountChange={(amount) => setFormData((prev) => ({ ...prev, amount }))}
        onCurrencyChange={(currency) => setFormData((prev) => ({ ...prev, currency }))}
        currencyLocked={!!selectedAccount}
        sign={isExpense ? '−' : '+'}
        autoFocus={!isEdit}
      />

      <Field label="Categoría">
        <Box display="flex" flexWrap="wrap" gap={2}>
          {visibleCategories.map((c) => (
            <Chip
              key={c.id}
              selected={formData.category_id === c.id}
              onClick={() => setFormData((prev) => ({ ...prev, category_id: c.id }))}
            >
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
          <Button
            onClick={() => setQuickCategoryOpen(true)}
            h="36px"
            px={3.5}
            gap={1}
            fontSize="13px"
            variant="ghost"
            color="brand"
            boxShadow="inset 0 0 0 1px var(--chakra-colors-line)"
          >
            <LuPlus />
            Nueva
          </Button>
        </Box>
      </Field>

      {accounts.length > 0 && (
        <Field label="Cuenta">
          <AccountChips
            accounts={accounts}
            value={formData.account_id}
            onChange={handleAccountChange}
            leading={{ value: '', label: '∅ Sin cuenta', hint: 'No mueve saldo' }}
          />
          {cardOverLimit && selectedAccount && (
            <Text mt={2} fontSize="13px" color="neg" bg="negSoft" borderRadius="input" px={3} py={2}>
              El monto excede el cupo disponible (
              {formatCurrency(selectedAccount.balance, selectedAccount.currency)})
            </Text>
          )}
        </Field>
      )}

      <Box>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Field label="Descripción">
            <Input
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={selectedCategory?.name ?? 'Ej: Compra en supermercado'}
              h="44px"
            />
          </Field>
          <Field label="Fecha">
            <DateField
              value={formData.date}
              onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
              disabled={lockedDate}
              open={calendarOpen}
              onOpenChange={setCalendarOpen}
              inlineCalendar={false}
            />
          </Field>
        </Grid>
        {calendarOpen && (
          <Box mt={3}>
            <InlineCalendar
              value={formData.date}
              onChange={(date) => {
                setFormData((prev) => ({ ...prev, date }))
                setCalendarOpen(false)
              }}
            />
          </Box>
        )}
      </Box>

      <Field label="Notas" optional>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          rows={2}
          resize="none"
          placeholder="Algo que quieras recordar"
        />
      </Field>
    </FormModalContent>
  )
}

/**
 * Pulso "Nueva transacción" (and "Editar transacción" with `transaction`):
 * centered on desktop, bottom sheet on mobile.
 */
export function TransactionForm({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.transaction ? 'Editar transacción' : 'Nueva transacción'}
    >
      <TransactionFormBody {...props} />
    </FormModal>
  )
}
