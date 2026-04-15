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
  HStack,
  FieldRoot,
  FieldLabel,
  Input,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupItemHiddenInput,
  Button,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createCategory } from '@/lib/actions/categories.actions'
import { toaster } from '@/lib/toaster'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

const defaultForm = {
  name: '',
  type: 'expense' as 'income' | 'expense',
  icon: '',
  color: '#6366f1',
}

export function CategoryForm({ isOpen, onClose, userId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createCategory(userId, formData)

    if (result.success) {
      toaster.create({ title: 'Categoría creada', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
      setFormData(defaultForm)
    } else {
      toaster.create({ title: 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()} size="md" placement="center">
      <DialogBackdrop />
      <DialogPositioner>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
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
                    setFormData({ ...formData, type: value as 'income' | 'expense' })
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
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Transporte"
                />
              </FieldRoot>

              <HStack gap={4} w="full">
                <FieldRoot>
                  <FieldLabel>Icono</FieldLabel>
                  <IconPicker
                    value={formData.icon}
                    onChange={(icon) => setFormData({ ...formData, icon })}
                  />
                </FieldRoot>

                <FieldRoot>
                  <FieldLabel>Color</FieldLabel>
                  <ColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </FieldRoot>
              </HStack>

              <Button type="submit" colorPalette="brand" width="full" loading={loading}>
                Crear Categoría
              </Button>
            </VStack>
          </form>
        </DialogBody>
      </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
