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
  Button,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupItemHiddenInput,
  HStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createRecurringTransaction } from '@/lib/actions/recurring.actions'
import { toaster } from '@/lib/toaster'
import type { Category } from '@/types/database.types'

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
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
}

export function RecurringTransactionForm({ isOpen, onClose, userId, categories, onSuccess }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: any) => {
    const actualValue = typeof value === 'object' && value?.value ? value.value : value
    setForm(prev => ({ ...prev, [field]: actualValue }))
  }

  const handleSubmit = async () => {
    if (!form.amount || !form.category_id || !form.description) {
      toaster.create({ title: 'Por favor completa todos los campos requeridos', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const result = await createRecurringTransaction(userId, {
      amount: parseFloat(form.amount as string),
      currency: form.currency,
      type: form.type,
      category_id: form.category_id,
      description: form.description,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
    })

    setLoading(false)

    if (result.success) {
      toaster.create({ title: 'Transacción recurrente creada', type: 'success', duration: 3000 })
      setForm(defaultForm)
      onClose()
      onSuccess()
    } else {
      toaster.create({ title: 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={details => !details.open && onClose()} size="md" placement="center" lazyMount unmountOnExit>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent tabIndex={-1}>
          <DialogHeader>
            <DialogTitle>Nueva Transacción Recurrente</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
              <VStack gap="4">
                <FieldRoot required>
                  <FieldLabel>Tipo</FieldLabel>
                  <RadioGroupRoot
                    value={form.type}
                    onValueChange={({ value }) =>
                      setForm({ ...form, type: value as 'income' | 'expense' })
                    }
                    colorPalette="brand"
                  >
                    <HStack gap={4}>
                      <RadioGroupItem value="expense">
                        <RadioGroupItemHiddenInput />
                        <RadioGroupItemControl borderColor="#4F46E5" _checked={{ bg: '#4F46E5', borderColor: '#4F46E5' }} />
                        <RadioGroupItemText>Gasto</RadioGroupItemText>
                      </RadioGroupItem>
                      <RadioGroupItem value="income">
                        <RadioGroupItemHiddenInput />
                        <RadioGroupItemControl borderColor="#4F46E5" _checked={{ bg: '#4F46E5', borderColor: '#4F46E5' }} />
                        <RadioGroupItemText>Ingreso</RadioGroupItemText>
                      </RadioGroupItem>
                    </HStack>
                  </RadioGroupRoot>
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Monto</FieldLabel>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => handleChange('amount', e.target.value)}
                    step="0.01"
                  />
                </FieldRoot>

                <FieldRoot>
                  <FieldLabel>Moneda</FieldLabel>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={form.currency}
                      onChange={e => handleChange('currency', e.target.value)}
                    >
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                      <option value="VES">VES</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Categoría</FieldLabel>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={form.category_id}
                      onChange={e => handleChange('category_id', e.target.value)}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Descripción</FieldLabel>
                  <Input
                    placeholder="Ej: Suscripción Netflix"
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                  />
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Frecuencia</FieldLabel>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={form.frequency}
                      onChange={e => handleChange('frequency', e.target.value)}
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Fecha de Inicio</FieldLabel>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={e => handleChange('start_date', e.target.value)}
                  />
                </FieldRoot>

                <FieldRoot>
                  <FieldLabel>Fecha de Fin (Opcional)</FieldLabel>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={e => handleChange('end_date', e.target.value)}
                  />
                </FieldRoot>

                <Button type="submit" bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} width="full" loading={loading}>
                  Crear Recurrencia
                </Button>
              </VStack>
            </form>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
