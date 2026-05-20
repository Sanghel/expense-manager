'use client'

import {
  Box,
  VStack,
  HStack,
  FieldRoot,
  FieldLabel,
  Text,
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createCategory } from '@/lib/actions/categories.actions'
import { toaster } from '@/lib/toaster'
import { FormInput } from '@/components/ui/FormInput'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { IconPicker } from './IconPicker'
import { ColorPicker } from './ColorPicker'
import type { Category, CategoryType } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  defaultType: CategoryType
  onCreated: (category: Category) => void
}

export function QuickCategoryForm({ isOpen, onClose, userId, defaultType, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#6366f1',
  })

  const typeLabel = defaultType === 'expense' ? 'Gasto' : defaultType === 'income' ? 'Ingreso' : 'Ambos'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createCategory(userId, { ...formData, type: defaultType })

    if (result.success && result.data) {
      toaster.create({ title: `Categoría "${formData.name}" creada`, type: 'success', duration: 2500 })
      onCreated(result.data as Category)
      onClose()
      setFormData({ name: '', icon: '', color: '#6366f1' })
    } else {
      toaster.create({ title: 'Error al crear', description: result.error, type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent tabIndex={-1} maxW="400px">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <Box w="full" p={2} bg="#26262f" borderRadius="md">
                  <Text fontSize="xs" color="#B0B0B0">
                    Tipo: <Text as="span" color="white" fontWeight="medium">{typeLabel}</Text>
                  </Text>
                </Box>

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
                  Crear y Seleccionar
                </PrimaryButton>
              </VStack>
            </form>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
