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
  Box,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createTransaction } from '@/lib/actions/transactions.actions'
import { toaster } from '@/lib/toaster'
import type { Category } from '@/types/database.types'
import { CurrencyPreview } from './CurrencyPreview'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  onSuccess: () => void
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  currency: 'COP' as 'COP' | 'USD' | 'VES',
  category_id: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

type FormData = typeof defaultForm

export function TransactionForm({ isOpen, onClose, userId, categories, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createTransaction(userId, {
      ...formData,
      amount: parseFloat(formData.amount),
    })

    if (result.success) {
      toaster.create({ title: 'Transacción creada', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
      setFormData(defaultForm)
    } else {
      toaster.create({ title: 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()} size="lg" placement="center" lazyMount unmountOnExit>
      <DialogBackdrop />
      <DialogPositioner>
      <DialogContent tabIndex={-1}>
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
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
                    setFormData({ ...formData, type: value as FormData['type'], category_id: '' })
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

              <Box w="full" minH="10">
                <CurrencyPreview
                  amount={parseFloat(formData.amount) || 0}
                  fromCurrency={formData.currency}
                />
              </Box>

              <FieldRoot required>
                <FieldLabel>Descripción</FieldLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Compra en supermercado"
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
                  placeholder="Notas adicionales..."
                />
              </FieldRoot>

              <Button
                type="submit"
                colorPalette="brand"
                width="full"
                loading={loading}
              >
                Crear Transacción
              </Button>
            </VStack>
          </form>
        </DialogBody>
      </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
