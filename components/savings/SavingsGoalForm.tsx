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
  HStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createSavingsGoal } from '@/lib/actions/savings.actions'
import { toaster } from '@/lib/toaster'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

export function SavingsGoalForm({ isOpen, onClose, userId, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    currency: 'COP' as 'COP' | 'USD' | 'VES',
    deadline: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.target_amount) {
      toaster.create({ title: 'Por favor completa los campos requeridos', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const result = await createSavingsGoal(userId, {
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      currency: form.currency,
      deadline: form.deadline || undefined,
    })

    setLoading(false)

    if (result.success) {
      toaster.create({ title: 'Meta de ahorro creada', type: 'success', duration: 3000 })
      setForm({ name: '', target_amount: '', currency: 'COP', deadline: '' })
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
            <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
              <VStack gap="4">
                <FieldRoot required>
                  <FieldLabel>Nombre de la Meta</FieldLabel>
                  <Input
                    placeholder="Ej: Vacaciones"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                </FieldRoot>

                <FieldRoot required>
                  <FieldLabel>Monto Objetivo</FieldLabel>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.target_amount}
                    onChange={e => handleChange('target_amount', e.target.value)}
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

                <FieldRoot>
                  <FieldLabel>Fecha Límite (Opcional)</FieldLabel>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={e => handleChange('deadline', e.target.value)}
                  />
                </FieldRoot>

                <Button type="submit" bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} width="full" loading={loading}>
                  Crear Meta
                </Button>
              </VStack>
            </form>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
