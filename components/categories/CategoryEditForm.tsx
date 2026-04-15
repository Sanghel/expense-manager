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
  Button,
  Badge,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { updateCategory } from '@/lib/actions/categories.actions'
import { toaster } from '@/lib/toaster'
import type { Category } from '@/types/database.types'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'

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
    icon: category.icon ?? '',
    color: category.color ?? '#6366f1',
  })

  useEffect(() => {
    setFormData({
      name: category.name,
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
    <DialogRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()} size="md" placement="center" lazyMount unmountOnExit>
      <DialogBackdrop />
      <DialogPositioner>
      <DialogContent tabIndex={-1}>
        <DialogHeader>
          <HStack>
            <DialogTitle>Editar Categoría</DialogTitle>
            <Badge colorPalette={category.type === 'income' ? 'green' : 'red'} size="sm">
              {category.type === 'income' ? 'Ingreso' : 'Gasto'}
            </Badge>
          </HStack>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
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
