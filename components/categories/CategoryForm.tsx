'use client'

import { VStack, HStack, FieldRoot, FieldLabel } from '@chakra-ui/react'
import { useState } from 'react'
import { createCategory } from '@/lib/actions/categories.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

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
    <FormDialog isOpen={isOpen} onClose={onClose} title="Nueva Categoría">
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <RadioSelect
            label="Tipo"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v as 'income' | 'expense' })}
            options={TYPE_OPTIONS}
            required
          />

          <FormInput
            label="Nombre"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            placeholder="Ej: Transporte"
            required
          />

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

          <PrimaryButton type="submit" width="full" loading={loading}>
            Crear Categoría
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
