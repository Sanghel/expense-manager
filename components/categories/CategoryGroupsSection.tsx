'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react'
import { LuPlus } from 'react-icons/lu'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { CategoryGroupForm } from '@/components/categories/CategoryGroupForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteCategoryGroup } from '@/lib/actions/categoryGroups.actions'
import { toaster } from '@/lib/toaster'
import type { Category, CategoryGroupWithMembers } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  groups: CategoryGroupWithMembers[]
}

export function CategoryGroupsSection({ userId, categories, groups }: Props) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CategoryGroupWithMembers | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CategoryGroupWithMembers | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingGroup(null)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const result = await deleteCategoryGroup(userId, pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)

    if (result.success) {
      toaster.create({ title: 'Grupo eliminado', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: 'No se pudo eliminar', description: result.error, type: 'error', duration: 5000 })
    }
  }

  return (
    <Box mt={10}>
      <HStack justify="space-between" mb={2}>
        <Heading size="md" color="white">Grupos de categorías</Heading>
        <Button
          size="sm"
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={() => {
            setEditingGroup(null)
            setIsFormOpen(true)
          }}
        >
          <LuPlus />
          Nuevo grupo
        </Button>
      </HStack>

      <Text fontSize="sm" color="#B0B0B0" mb={4}>
        Agrupa varias categorías para presupuestarlas juntas — por ejemplo &quot;gastos
        hormiga&quot; con Ropa, Meriendas y Salidas. Una categoría puede estar en varios grupos.
      </Text>

      {groups.length === 0 ? (
        <Text fontSize="sm" color="#6b7280">
          Aún no has creado ningún grupo.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
          {groups.map((group) => (
            <Box
              key={group.id}
              borderWidth="1px"
              borderColor="#2d2d35"
              borderRadius="xl"
              bg="#1a1a23"
              p={4}
            >
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <Heading size="sm" color="white">
                    {group.icon ?? '📦'} {group.name}
                  </Heading>
                  <HStack gap={1}>
                    <ActionIconButton
                      kind="edit"
                      label="Editar grupo"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setEditingGroup(group)
                        setIsFormOpen(true)
                      }}
                    />
                    <ActionIconButton
                      kind="delete"
                      tone="danger"
                      label="Eliminar grupo"
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingDelete(group)}
                    />
                  </HStack>
                </HStack>

                {group.category_ids.length === 0 ? (
                  <Text fontSize="xs" color="#6b7280">Sin categorías asignadas</Text>
                ) : (
                  <HStack gap={1} flexWrap="wrap">
                    {group.category_ids.map((id) => {
                      const cat = categoryById.get(id)
                      if (!cat) return null
                      return (
                        <Badge key={id} size="sm" variant="outline" colorPalette="purple">
                          {cat.icon} {cat.name}
                        </Badge>
                      )
                    })}
                  </HStack>
                )}
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <CategoryGroupForm
        isOpen={isFormOpen}
        onClose={closeForm}
        userId={userId}
        categories={categories}
        editingGroup={editingGroup}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar grupo"
        description="Las categorías no se eliminan, solo se deshace la agrupación."
        isLoading={deleting}
      />
    </Box>
  )
}
