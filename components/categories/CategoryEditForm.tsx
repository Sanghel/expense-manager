'use client'

import { VStack, HStack, FieldRoot, FieldLabel } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { updateCategory } from '@/lib/actions/categories.actions'
import { toaster } from '@/lib/toaster'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { RadioSelect } from '@/components/ui/RadioSelect'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Category, CategoryType } from '@/types/database.types'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
  { value: 'both', label: 'Ambos' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  category: Category
  onSuccess: () => void
}

export function CategoryEditForm({ isOpen, onClose, userId, category, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category.name,
    type: category.type as CategoryType,
    icon: category.icon ?? '',
    color: category.color ?? '#6366f1',
  })

  useEffect(() => {
    setFormData({
      name: category.name,
      type: category.type as CategoryType,
      icon: category.icon ?? '',
      color: category.color ?? '#6366f1',
    })
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateCategory(category.id, userId, formData)

    if (result.success) {
      toaster.create({ title: 'Categoría actualizada', type: 'success', duration: 3000 })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: 'Error al actualizar', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title="Editar Categoría">
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <RadioSelect
            label="Tipo"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v as CategoryType })}
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
            Guardar Cambios
          </PrimaryButton>
        </VStack>
      </form>
    </FormDialog>
  )
}
