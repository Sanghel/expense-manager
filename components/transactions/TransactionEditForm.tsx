'use client'

import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  VStack,
  FieldRoot,
  FieldLabel,
  Input,
  NativeSelectRoot,
  NativeSelectField,
  Textarea,
  Button,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupItemHiddenInput,
  HStack,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { updateTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import { CurrencyPreview } from './CurrencyPreview'
import type { Category, TransactionWithCategory } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  transaction: TransactionWithCategory
  onSuccess: () => void
}

export function TransactionEditForm({
  isOpen,
  onClose,
  userId,
  categories,
  transaction,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    type: transaction.type,
    amount: String(transaction.amount),
    currency: transaction.currency,
    category_id: transaction.category_id,
    description: transaction.description,
    date: transaction.date,
    notes: transaction.notes ?? '',
  })

  useEffect(() => {
    setFormData({
      type: transaction.type,
      amount: String(transaction.amount),
      currency: transaction.currency,
      category_id: transaction.category_id,
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
      amount: parseFloat(formData.amount),
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

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()} size="lg" placement="center">
      <DialogBackdrop />
      <DialogPositioner>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <FieldRoot required>
                <FieldLabel>Tipo</FieldLabel>
                <RadioGroupRoot
                  value={formData.type}
                  onValueChange={({ value }) =>
                    setFormData({ ...formData, type: value as 'income' | 'expense', category_id: '' })
                  }
                >
                  <HStack gap={4}>
                    <RadioGroupItem value="expense">
                      <RadioGroupItemHiddenInput />
                      <RadioGroupItemControl />
                      <RadioGroupItemText>Gasto</RadioGroupItemText>
                    </RadioGroupItem>
                    <RadioGroupItem value="income">
                      <RadioGroupItemHiddenInput />
                      <RadioGroupItemControl />
                      <RadioGroupItemText>Ingreso</RadioGroupItemText>
                    </RadioGroupItem>
                  </HStack>
                </RadioGroupRoot>
              </FieldRoot>

              <FieldRoot required>
                <FieldLabel>Monto</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </FieldRoot>

              <FieldRoot required>
                <FieldLabel>Moneda</FieldLabel>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'COP' | 'USD' | 'VES' })}
                  >
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="VES">VES - Bolívar (Bs)</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </FieldRoot>

              <FieldRoot required>
                <FieldLabel>Categoría</FieldLabel>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </FieldRoot>

              <CurrencyPreview
                amount={parseFloat(formData.amount) || 0}
                fromCurrency={formData.currency}
              />

              <FieldRoot required>
                <FieldLabel>Descripción</FieldLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FieldRoot>

              <FieldRoot required>
                <FieldLabel>Fecha</FieldLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Notas (opcional)</FieldLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </FieldRoot>

              <Button
                type="submit"
                colorPalette="brand"
                width="full"
                loading={loading}
              >
                Guardar Cambios
              </Button>
            </VStack>
          </form>
        </DialogBody>
      </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
