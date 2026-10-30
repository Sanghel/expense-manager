'use client'

import { Box, Button, Flex, Icon, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { LuPencil, LuPlus, LuX } from 'react-icons/lu'
import { deleteCategory } from '@/lib/actions/categories.actions'
import { useRouter } from 'next/navigation'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { CategoryGroupsSection } from '@/components/categories/CategoryGroupsSection'
import type { Category, CategoryGroupWithMembers, CategoryType } from '@/types/database.types'

interface Props {
  userId: string
  initialCategories: Category[]
  initialGroups?: CategoryGroupWithMembers[]
}

const SECTIONS: { type: CategoryType; label: string }[] = [
  { type: 'expense', label: 'Gastos' },
  { type: 'income', label: 'Ingresos' },
  { type: 'both', label: 'Gastos e ingresos' },
]

/**
 * Category as a 42px pill: tinted circle with the emoji + name. The user's own
 * categories carry a brand ring and edit/delete; predefined ones are plain.
 */
function CategoryChip({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit?: () => void
  onDelete?: () => void
}) {
  const own = category.user_id !== null
  return (
    <Flex
      align="center"
      gap={2}
      h="42px"
      ps="6px"
      pe={own ? 1.5 : 4}
      bg="surface"
      borderRadius="pill"
      boxShadow={own ? 'inset 0 0 0 1px var(--chakra-colors-brand)' : 'none'}
      title={own ? undefined : 'Categoría predefinida'}
    >
      <Flex
        align="center"
        justify="center"
        boxSize="30px"
        borderRadius="full"
        fontSize="15px"
        flexShrink={0}
        style={{
          background: `color-mix(in oklab, ${category.color ?? 'var(--chakra-colors-text3)'} 22%, transparent)`,
        }}
      >
        {category.icon ?? '🏷️'}
      </Flex>
      <Text fontSize="14px" color="text" whiteSpace="nowrap">
        {category.name}
      </Text>
      {own && (
        <Flex gap={0.5}>
          <Button aria-label={`Editar ${category.name}`} onClick={onEdit} size="xs" variant="ghost" color="brand" minW="28px" h="28px" p={0}>
            <LuPencil />
          </Button>
          <Button
            aria-label={`Eliminar ${category.name}`}
            onClick={onDelete}
            size="xs"
            variant="ghost"
            color="text3"
            _hover={{ color: 'neg', bg: 'negSoft' }}
            minW="28px"
            h="28px"
            p={0}
          >
            <LuX />
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

export function CategoriesPageClient({ userId, initialCategories, initialGroups = [] }: Props) {
  const categories = initialCategories
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const router = useRouter()

  const createDisclosure = useDisclosure()
  const editDisclosure = useDisclosure()
  const deleteDisclosure = useDisclosure()

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handleEditOpen = (cat: Category) => {
    setSelectedCategory(cat)
    editDisclosure.onOpen()
  }

  const handleDeleteOpen = (cat: Category) => {
    setSelectedCategory(cat)
    setDeletingId(cat.id)
    deleteDisclosure.onOpen()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleteLoading(true)

    const result = await deleteCategory(deletingId, userId)

    if (result.success) {
      toaster.create({ title: 'Categoría eliminada', type: 'success', duration: 3000 })
      deleteDisclosure.onClose()
      await refresh()
    } else {
      toaster.create({ title: 'No se pudo eliminar', description: result.error, type: 'error', duration: 5000 })
    }
    setDeleteLoading(false)
  }

  return (
    <Box>
      <Stack gap={7}>
        {SECTIONS.map(({ type, label }) => {
          // Predefined first, then the user's own.
          const items = categories
            .filter((c) => c.type === type)
            .sort((a, b) => Number(a.user_id !== null) - Number(b.user_id !== null) || a.name.localeCompare(b.name))
          if (items.length === 0 && type === 'both') return null
          return (
            <Box key={type}>
              <Text textStyle="sectionLabel" color="text3" mb={3}>
                {label}
              </Text>
              <Flex wrap="wrap" gap={2}>
                {items.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    category={cat}
                    onEdit={() => handleEditOpen(cat)}
                    onDelete={() => handleDeleteOpen(cat)}
                  />
                ))}
                {type === 'expense' && (
                  <Button
                    onClick={createDisclosure.onOpen}
                    h="42px"
                    px={4}
                    bg="brandSoft"
                    color="brand"
                    _hover={{ opacity: 0.85 }}
                  >
                    <Icon as={LuPlus} />
                    Nueva categoría
                  </Button>
                )}
              </Flex>
            </Box>
          )
        })}
      </Stack>

      <CategoryGroupsSection
        userId={userId}
        categories={categories}
        groups={initialGroups}
      />

      {/* Modales */}
      <CategoryForm
        isOpen={createDisclosure.open}
        onClose={createDisclosure.onClose}
        userId={userId}
        onSuccess={refresh}
      />

      {selectedCategory && (
        <CategoryForm
          isOpen={editDisclosure.open}
          onClose={editDisclosure.onClose}
          userId={userId}
          editingCategory={selectedCategory}
          onSuccess={refresh}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDisclosure.open}
        onClose={deleteDisclosure.onClose}
        onConfirm={handleDelete}
        title="Eliminar categoría"
        description={`¿Seguro que deseas eliminar ${selectedCategory?.icon ?? ''} ${selectedCategory?.name ?? ''}? Esta acción no se puede deshacer.`}
        isLoading={deleteLoading}
      />
    </Box>
  )
}
