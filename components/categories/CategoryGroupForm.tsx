'use client'

import { useState } from 'react'
import { Flex, Grid, Input } from '@chakra-ui/react'
import { Chip, Field, FormModal, FormModalContent } from '@/components/ui/pulso'
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

/** Pulso "Nuevo grupo de categorías" / "Editar grupo". */
export function CategoryGroupForm({ isOpen, onClose, editingGroup, ...props }: Props) {
  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={editingGroup ? 'Editar grupo' : 'Nuevo grupo de categorías'}>
      <GroupFields onClose={onClose} editingGroup={editingGroup ?? null} {...props} />
    </FormModal>
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

  const handleSubmit = async () => {
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
        title: `${editingGroup ? 'Grupo actualizado' : 'Grupo creado'} · ${payload.name}`,
        type: 'success',
        duration: 2600,
      })
      onSuccess()
      onClose()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 4000 })
    }
  }

  return (
    <FormModalContent
      title={editingGroup ? 'Editar grupo' : 'Nuevo grupo de categorías'}
      subtitle="Su presupuesto es la suma de los de sus categorías"
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={!!name.trim()}
      loading={loading}
      submitLabel={editingGroup ? 'Guardar cambios' : 'Crear grupo'}
    >
      <Grid templateColumns="88px 1fr" gap={3}>
        <Field label="Ícono">
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📦"
            aria-label="Ícono (emoji)"
            h="44px"
            textAlign="center"
            fontSize="18px"
          />
        </Field>
        <Field label="Nombre">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Gastos hormiga"
            h="44px"
            autoFocus={!editingGroup}
          />
        </Field>
      </Grid>

      <Field label={`Categorías del grupo · ${selected.length}`}>
        <Flex wrap="wrap" gap={2}>
          {categories.map((cat) => (
            <Chip key={cat.id} selected={selected.includes(cat.id)} onClick={() => toggle(cat.id)}>
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </Chip>
          ))}
        </Flex>
      </Field>
    </FormModalContent>
  )
}
