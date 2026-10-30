'use client'

import { useState } from 'react'
import { Box, Flex, Input, Text } from '@chakra-ui/react'
import { createCategory, updateCategory } from '@/lib/actions/categories.actions'
import { toaster } from '@/lib/toaster'
import {
  ColorSwatches,
  EmojiGrid,
  Field,
  FormModal,
  FormModalContent,
  SegmentedControl,
} from '@/components/ui/pulso'
import type { Category, CategoryType } from '@/types/database.types'

// The handoff's icons first, then the rest of the old picker's set.
const ICONS = [
  '🏷️', '🛒', '🍽️', '☕', '🚗', '🏠', '💡', '📺', '💊', '🎬', '✈️', '🎁', '🐾', '📚', '👕', '💼',
  '🍔', '🍕', '🍜', '🍣', '🚌', '🏋️', '🎮', '👗', '👟', '💄', '💻', '📱', '🔧', '⚡', '🌊', '🌿',
  '🏖️', '🎵', '💰', '💳', '🏦', '📈', '💸', '🎓', '🏥', '🛍️', '🍷', '🧾', '🔑', '🏡', '🚿', '🧹',
  '📦', '🧺', '🎨', '✂️', '🖥️',
]

const TYPE_LABEL: Record<CategoryType, string> = { expense: 'Gasto', income: 'Ingreso', both: 'Ambos' }

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  /** Edit mode: the same modal, prefilled, saving with `updateCategory`. */
  editingCategory?: Category | null
  defaultType?: CategoryType
  /** The type comes from the caller (quick create inside Nueva transacción). */
  lockType?: boolean
  onSuccess?: () => void
  /** Receives the created category (quick create selects it). */
  onCreated?: (category: Category) => void
}

function CategoryFormBody({
  onClose,
  userId,
  editingCategory,
  defaultType,
  lockType,
  onSuccess,
  onCreated,
}: Omit<Props, 'isOpen'>) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(() => ({
    name: editingCategory?.name ?? '',
    type: (editingCategory?.type ?? defaultType ?? 'expense') as CategoryType,
    icon: editingCategory?.icon ?? '🏷️',
    color: editingCategory?.color ?? '#6366f1',
  }))
  const set = (patch: Partial<typeof formData>) => setFormData((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async () => {
    setLoading(true)
    const data = { ...formData, name: formData.name.trim() }
    const result = editingCategory
      ? await updateCategory(editingCategory.id, userId, data)
      : await createCategory(userId, data)

    if (result.success) {
      toaster.create({
        title: `${editingCategory ? 'Categoría actualizada' : 'Categoría creada'} · ${data.name}`,
        type: 'success',
        duration: 2600,
      })
      if (!editingCategory && result.data) onCreated?.(result.data as Category)
      onSuccess?.()
      onClose()
    } else {
      toaster.create({
        title: editingCategory ? 'Error al actualizar' : 'Error al crear',
        description: result.error,
        type: 'error',
        duration: 4000,
      })
    }
    setLoading(false)
  }

  return (
    <FormModalContent
      title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
      subtitle={lockType ? `Categoría de ${TYPE_LABEL[formData.type].toLowerCase()}` : undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
      canSubmit={!!formData.name.trim()}
      loading={loading}
      submitLabel={editingCategory ? 'Guardar cambios' : 'Crear categoría'}
    >
      {/* Preview: the chip as it shows in Ajustes → Categorías. */}
      <Flex align="center" justify="space-between" gap={3} bg="bg" borderRadius="20px" px={4} py={5}>
        <Flex
          align="center"
          gap={2}
          h="36px"
          px={3.5}
          borderRadius="pill"
          fontSize="13px"
          fontWeight="500"
          color="text"
          minW={0}
          style={{
            background: `color-mix(in oklab, ${formData.color} 22%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${formData.color} 45%, transparent)`,
          }}
        >
          <span>{formData.icon}</span>
          <Text as="span" truncate>
            {formData.name.trim() || 'Nueva categoría'}
          </Text>
        </Flex>
        <Text fontFamily="mono" fontSize="11px" color="text3" textTransform="uppercase" letterSpacing="0.08em">
          {TYPE_LABEL[formData.type]}
        </Text>
      </Flex>

      {!lockType && (
        <Field label="Tipo">
          <SegmentedControl
            label="Tipo"
            value={formData.type}
            onChange={(type) => set({ type })}
            fullWidth
            options={[
              { value: 'expense', label: 'Gasto' },
              { value: 'income', label: 'Ingreso' },
              { value: 'both', label: 'Ambos' },
            ]}
          />
        </Field>
      )}

      <Field label="Nombre">
        <Input
          value={formData.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Ej: Transporte"
          h="44px"
          autoFocus={!editingCategory}
        />
      </Field>

      <Field label="Ícono">
        <EmojiGrid
          value={formData.icon}
          onChange={(icon) => set({ icon })}
          emojis={!formData.icon || ICONS.includes(formData.icon) ? ICONS : [formData.icon, ...ICONS]}
        />
      </Field>

      <Box>
        <Field label="Color">
          <ColorSwatches value={formData.color} onChange={(color) => set({ color })} />
        </Field>
      </Box>
    </FormModalContent>
  )
}

/**
 * Pulso "Nueva categoría" / "Editar categoría": one modal for creating,
 * editing and the quick create inside Nueva transacción (`lockType`).
 */
export function CategoryForm({ isOpen, ...props }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.editingCategory ? 'Editar categoría' : 'Nueva categoría'}
    >
      <CategoryFormBody {...props} />
    </FormModal>
  )
}
