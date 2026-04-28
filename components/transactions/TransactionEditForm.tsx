'use client'

import { VStack, Box, SimpleGrid, FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { updateTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { InputAmount } from '@/components/ui/InputAmount'
import { FormTextarea } from '@/components/ui/FormTextarea'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CurrencyPreview } from './CurrencyPreview'
import type { Account, Category, Currency, TransactionWithCategory } from '@/types/database.types'

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
  transaction: TransactionWithCategory
  onSuccess: () => void
}

export function TransactionEditForm({ isOpen, onClose, userId, categories, accounts = [], transaction, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: transaction.type,
    amount: Number(transaction.amount) as number | undefined,
    currency: transaction.currency as Currency,
    category_id: transaction.category_id,
    account_id: transaction.account_id ?? '',
    description: transaction.description,
    date: transaction.date,
    notes: transaction.notes ?? '',
  })

  useEffect(() => {
    setFormData({
      type: transaction.type,
      amount: Number(transaction.amount) as number | undefined,
      currency: transaction.currency as Currency,
      category_id: transaction.category_id,
      account_id: transaction.account_id ?? '',
      description: transaction.description,
      date: transaction.date,
      notes: transaction.notes ?? '',
    })
  }, [transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateTransaction(transaction.id, userId, {
      ...formData,
      amount: formData.amount ?? 0,
      account_id: formData.account_id || null,
    })

    if (result.success) {
      toaster.create({ title: 'Transacción actualizada', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error al actualizar', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title="Editar Transacción" size="lg">
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
            <CurrencySelect
              value={formData.currency}
              onChange={(v) => setFormData({ ...formData, currency: v })}
              showFullLabel
              required
            />
          </SimpleGrid>

          <CategorySelect
            value={formData.category_id}
            onChange={(v) => setFormData({ ...formData, category_id: v })}
            categories={categories}
            filterByType={formData.type}
            required
          />

          {accounts.length > 0 && (
            <FieldRoot>
              <FieldLabel>Cuenta (opcional)</FieldLabel>
              <NativeSelectRoot>
                <NativeSelectField
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                >
                  <option value="">Sin cuenta específica</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon ?? '💳'} {acc.name} ({acc.currency})
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </FieldRoot>
          )}

          <Box w="full" minH="10">
            <CurrencyPreview
              amount={formData.amount ?? 0}
              fromCurrency={formData.currency}
            />
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
            <FormInput
              label="Descripción"
              value={formData.description}
              onChange={(v) => setFormData({ ...formData, description: v })}
              required
            />
            <FormInput
              label="Fecha"
              value={formData.date}
              onChange={(v) => setFormData({ ...formData, date: v })}
              type="date"
              required
            />
          </SimpleGrid>

          <FormTextarea
            label="Notas (opcional)"
            value={formData.notes}
            onChange={(v) => setFormData({ ...formData, notes: v })}
          />

          <PrimaryButton type="submit" width="full" loading={loading}>
            Guardar Cambios
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
