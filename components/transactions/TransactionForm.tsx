'use client'

import { VStack, Box, SimpleGrid, Button, Text } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { DateInput } from '@/components/ui/DateInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { FormTextarea } from '@/components/ui/FormTextarea'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { AccountSelect } from '@/components/ui/AccountSelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CurrencyPreview } from './CurrencyPreview'
import { QuickCategoryForm } from '@/components/categories/QuickCategoryForm'
import type { Account, Category, Currency } from '@/types/database.types'
import { getLocalDateString } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/currency'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

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
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  amount: undefined as number | undefined,
  currency: 'COP' as Currency,
  category_id: '',
  account_id: '',
  description: '',
  date: getLocalDateString(),
  notes: '',
}

export function TransactionForm({ isOpen, onClose, userId, categories, accounts = [], onSuccess, initialDate, lockedDate, prefillDescription, prefillCategoryId }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ ...defaultForm, date: initialDate ?? getLocalDateString() })
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [quickCategoryOpen, setQuickCategoryOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...defaultForm,
        date: initialDate ?? getLocalDateString(),
        description: prefillDescription ?? '',
        category_id: prefillCategoryId ?? '',
      })
      setLocalCategories(categories)
    }
  }, [isOpen, initialDate, categories, prefillDescription, prefillCategoryId])

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    setFormData((prev) => ({
      ...prev,
      account_id: accountId,
      currency: account ? (account.currency as Currency) : prev.currency,
    }))
  }

  const accountLocksCurrency = !!formData.account_id

  const selectedAccount = accounts.find((a) => a.id === formData.account_id)
  const cardOverLimit =
    formData.type === 'expense' &&
    selectedAccount?.type === 'card' &&
    formData.amount != null &&
    formData.amount > (selectedAccount.balance ?? 0)

  const handleCategoryCreated = (newCategory: Category) => {
    setLocalCategories((prev) => [...prev, newCategory])
    setFormData((prev) => ({ ...prev, category_id: newCategory.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createTransaction(userId, {
      ...formData,
      amount: formData.amount ?? 0,
      account_id: formData.account_id || null,
    })

    if (result.success) {
      toaster.create({ title: 'Transacción creada', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
      setFormData({ ...defaultForm, date: initialDate ?? getLocalDateString() })
    } else {
      toaster.create({ title: 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <>
      <FormDialog isOpen={isOpen} onClose={onClose} title="Nueva Transacción" size="lg">
        <form onSubmit={handleSubmit}>
          <VStack gap={4}>
            <RadioSelect
              label="Tipo"
              value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v as 'income' | 'expense', category_id: '' })}
              options={TYPE_OPTIONS}
              required
            />

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
              <InputAmount
                label="Monto"
                value={formData.amount}
                onChange={(v) => setFormData({ ...formData, amount: v })}
                isRequired
              />
              {accounts.length > 0 ? (
                <AccountSelect
                  value={formData.account_id}
                  onChange={handleAccountChange}
                  accounts={accounts}
                  label="Cuenta"
                  optional
                  placeholder="Sin cuenta específica"
                />
              ) : (
                <CurrencySelect
                  value={formData.currency}
                  onChange={(v) => setFormData({ ...formData, currency: v })}
                  showFullLabel
                  required
                />
              )}
            </SimpleGrid>

            {accounts.length > 0 && (
              <CurrencySelect
                value={formData.currency}
                onChange={(v) => setFormData({ ...formData, currency: v })}
                showFullLabel
                required
                disabled={accountLocksCurrency}
              />
            )}

            {cardOverLimit && (
              <Box w="full" bg="#7f1d1d" borderRadius="md" px={3} py={2}>
                <Text fontSize="sm" color="#fca5a5">
                  El monto excede el cupo disponible ({formatCurrency(selectedAccount!.balance, selectedAccount!.currency as any)})
                </Text>
              </Box>
            )}

            <Box w="full">
              <CategorySelect
                value={formData.category_id}
                onChange={(v) => setFormData({ ...formData, category_id: v })}
                categories={localCategories}
                filterByType={formData.type}
                required
              />
              <Button
                variant="ghost"
                size="xs"
                color="#6366f1"
                mt={1}
                px={0}
                _hover={{ color: '#818cf8', bg: 'transparent' }}
                onClick={() => setQuickCategoryOpen(true)}
              >
                <FiPlus style={{ marginRight: 4 }} />
                Nueva categoría
              </Button>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
              <FormInput
                label="Descripción"
                value={formData.description}
                onChange={(v) => setFormData({ ...formData, description: v })}
                placeholder="Ej: Compra en supermercado"
                required
              />
              <DateInput
                label="Fecha"
                value={formData.date}
                onChange={(v) => setFormData({ ...formData, date: v })}
                required
                disabled={lockedDate}
              />
            </SimpleGrid>

            <Box w="full" minH="10">
              <CurrencyPreview
                amount={formData.amount ?? 0}
                fromCurrency={formData.currency}
              />
            </Box>

            <FormTextarea
              label="Notas (opcional)"
              value={formData.notes}
              onChange={(v) => setFormData({ ...formData, notes: v })}
              placeholder="Notas adicionales..."
            />

            <PrimaryButton type="submit" width="full" loading={loading}>
              Crear Transacción
            </PrimaryButton>
          </VStack>
        </form>
      </FormDialog>

      <QuickCategoryForm
        isOpen={quickCategoryOpen}
        onClose={() => setQuickCategoryOpen(false)}
        userId={userId}
        defaultType={formData.type}
        onCreated={handleCategoryCreated}
      />
    </>
  )
}
