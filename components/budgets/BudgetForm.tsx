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
import { createBudget } from '@/lib/actions/budgets.actions'
import { toaster } from '@/lib/toaster'
import type { Category } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  onSuccess: () => void
}

type BudgetType = 'income' | 'expense'

const defaultForm = {
  type: 'expense' as BudgetType,
  category_id: '',
  amount: '',
  currency: 'COP' as 'COP' | 'USD' | 'VES',
  period: 'monthly' as 'monthly' | 'yearly',
  start_date: new Date().toISOString().split('T')[0],
}

type FormData = typeof defaultForm

export function BudgetForm({ isOpen, onClose, userId, categories, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.category_id) {
      toaster.create({ title: 'Error', description: 'Debes seleccionar una categoría', type: 'error', duration: 3000 })
      setLoading(false)
      return
    }

    const result = await createBudget(userId, {
      category_id: formData.category_id,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      period: formData.period,
      start_date: formData.start_date,
    })

    if (result.success) {
      toaster.create({ title: 'Presupuesto creado', type: 'success', duration: 3000 })
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
            <DialogTitle>Nuevo Presupuesto</DialogTitle>
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

                <FieldRoot required>
                  <FieldLabel>Monto del Presupuesto</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Moneda</FieldLabel>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as FormData['currency'] })}
                    >
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                      <option value="VES">VES</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Periodo</FieldLabel>
                  <RadioGroupRoot
                    value={formData.period}
                    onValueChange={({ value }) => setFormData({ ...formData, period: value as FormData['period'] })}
                    colorPalette="brand"
                  >
                    <HStack gap={4}>
                      <RadioGroupItem value="monthly">
                        <RadioGroupItemHiddenInput />
                        <RadioGroupItemControl borderColor="#4F46E5" _checked={{ bg: '#4F46E5', borderColor: '#4F46E5' }} />
                        <RadioGroupItemText>Mensual</RadioGroupItemText>
                      </RadioGroupItem>
                      <RadioGroupItem value="yearly">
                        <RadioGroupItemHiddenInput />
                        <RadioGroupItemControl borderColor="#4F46E5" _checked={{ bg: '#4F46E5', borderColor: '#4F46E5' }} />
                        <RadioGroupItemText>Anual</RadioGroupItemText>
                      </RadioGroupItem>
                    </HStack>
                  </RadioGroupRoot>
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Fecha de Inicio</FieldLabel>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </FieldRoot>

                <HStack gap={4} pt={4} w="full" justifyContent="flex-end">
                  <Button onClick={onClose} variant="outline">
                    Cancelar
                  </Button>
                  <Button
                    bg="#4F46E5"
                    color="white"
                    _hover={{ bg: '#4338CA' }}
                    type="submit"
                    loading={loading}
                  >
                    Crear Presupuesto
                  </Button>
                </HStack>
              </VStack>
            </form>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
