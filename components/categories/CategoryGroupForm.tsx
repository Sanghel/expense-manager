'use client'

import { useState } from 'react'
import { VStack, HStack, SimpleGrid, Box, Text, Checkbox } from '@chakra-ui/react'
import { FormDialog } from '@/components/ui/FormDialog'
import { FormInput } from '@/components/ui/FormInput'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CancelButton } from '@/components/ui/CancelButton'
import {
  createCategoryGroup,
  updateCategoryGroup,
  setGroupMembers,
} from '@/lib/actions/categoryGroups.actions'
import { toaster } from '@/lib/toaster'
import type { Category, CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  editingGroup?: CategoryGroupWithMembers | null
  onSuccess: () => void
}

export function CategoryGroupForm({
  isOpen,
  onClose,
  userId,
  categories,
  editingGroup,
  onSuccess,
}: Props) {
  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingGroup ? 'Editar grupo' : 'Nuevo grupo de categorías'}
      size="lg"
    >
      {/* Mounted only while open and keyed by the group, so the fields start
          from the right values without an effect that re-syncs state. */}
      {isOpen && (
        <GroupFields
          key={editingGroup?.id ?? 'new'}
          userId={userId}
          categories={categories}
          editingGroup={editingGroup ?? null}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </FormDialog>
  )
}

interface FieldsProps {
  userId: string
  categories: Category[]
  editingGroup: CategoryGroupWithMembers | null
  onClose: () => void
  onSuccess: () => void
}

function GroupFields({ userId, categories, editingGroup, onClose, onSuccess }: FieldsProps) {
  const [name, setName] = useState(editingGroup?.name ?? '')
  const [icon, setIcon] = useState(editingGroup?.icon ?? '')
  const [selected, setSelected] = useState<string[]>(editingGroup?.category_ids ?? [])
  const [loading, setLoading] = useState(false)

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toaster.create({ title: 'El nombre es obligatorio', type: 'error', duration: 3000 })
      return
    }

    setLoading(true)
    const payload = { name: name.trim(), icon: icon.trim() || null }

    const result = editingGroup
      ? await updateCategoryGroup(userId, editingGroup.id, payload)
      : await createCategoryGroup(userId, { ...payload, category_ids: selected })

    if (result.success && editingGroup) {
      const membersResult = await setGroupMembers(userId, editingGroup.id, selected)
      if (!membersResult.success) {
        setLoading(false)
        toaster.create({ title: membersResult.error || 'Error', type: 'error', duration: 4000 })
        return
      }
    }

    setLoading(false)

    if (result.success) {
      toaster.create({
        title: editingGroup ? 'Grupo actualizado' : 'Grupo creado',
        type: 'success',
        duration: 3000,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 4000 })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={4} align="stretch">
        <FormInput
          label="Nombre del grupo"
          value={name}
          onChange={setName}
          placeholder="Ej: Gastos hormiga"
          required
        />

        <FormInput
          label="Icono (emoji)"
          value={icon}
          onChange={setIcon}
          placeholder="📦"
        />

        <Box>
          <Text fontSize="sm" color="#B0B0B0" mb={2}>
            Categorías del grupo ({selected.length})
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} maxH="260px" overflowY="auto">
            {categories.map((cat) => (
              <Checkbox.Root
                key={cat.id}
                checked={selected.includes(cat.id)}
                onCheckedChange={() => toggle(cat.id)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  {cat.icon} {cat.name}
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
          </SimpleGrid>
        </Box>

        <HStack gap={4} pt={2} justifyContent="flex-end">
          <CancelButton onClick={onClose} />
          <PrimaryButton type="submit" loading={loading}>
            {editingGroup ? 'Guardar cambios' : 'Crear grupo'}
          </PrimaryButton>
        </HStack>
      </VStack>
    </form>
  )
}
