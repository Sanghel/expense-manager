'use client'

import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  SimpleGrid,
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@chakra-ui/react'
import { useState, useCallback, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useDisclosure } from '@chakra-ui/react'
import { deleteCategory } from '@/lib/actions/categories.actions'
import { useRouter } from 'next/navigation'
import { toaster } from '@/lib/toaster'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { CategoryEditForm } from '@/components/categories/CategoryEditForm'
import type { Category } from '@/types/database.types'

interface Props {
  userId: string
  initialCategories: Category[]
}

export function CategoriesPageClient({ userId, initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
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

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

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

  const predefined = categories.filter((c) => c.user_id === null)
  const userCategories = categories.filter((c) => c.user_id !== null)

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="white">Categorías</Heading>
        <Button bg="#4F46E5" color="white" _hover={{ bg: '#4338CA' }} onClick={createDisclosure.onOpen}>
          <FiPlus />
          Nueva Categoría
        </Button>
      </HStack>

      <VStack gap={8} align="stretch">
        {/* Categorías predefinidas */}
        <Box>
          <Text fontWeight="semibold" color="#B0B0B0" mb={3} fontSize="sm" textTransform="uppercase">
            Predefinidas
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3}>
            {predefined.map((cat) => (
              <CategoryCard key={cat.id} category={cat} readOnly />
            ))}
          </SimpleGrid>
        </Box>

        {/* Categorías del usuario */}
        <Box>
          <Text fontWeight="semibold" color="#B0B0B0" mb={3} fontSize="sm" textTransform="uppercase">
            Mis Categorías
          </Text>
          {userCategories.length === 0 ? (
            <Text color="#808080" fontSize="sm">
              Aún no tienes categorías personalizadas. Crea una con el botón de arriba.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3}>
              {userCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={() => handleEditOpen(cat)}
                  onDelete={() => handleDeleteOpen(cat)}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>

      {/* Modales */}
      <CategoryForm
        isOpen={createDisclosure.open}
        onClose={createDisclosure.onClose}
        userId={userId}
        onSuccess={refresh}
      />

      {selectedCategory && (
        <CategoryEditForm
          isOpen={editDisclosure.open}
          onClose={editDisclosure.onClose}
          userId={userId}
          category={selectedCategory}
          onSuccess={refresh}
        />
      )}

      {/* Confirmación eliminar */}
      <DialogRoot
        open={deleteDisclosure.open}
        onOpenChange={({ open }) => !open && deleteDisclosure.onClose()}
        role="alertdialog"
        placement="center"
        lazyMount
        unmountOnExit
      >
        <DialogBackdrop />
        <DialogPositioner>
        <DialogContent tabIndex={-1}>
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <Text mb={4}>
              ¿Seguro que deseas eliminar{' '}
              <Text as="span" fontWeight="bold">
                {selectedCategory?.icon} {selectedCategory?.name}
              </Text>
              ? Esta acción no se puede deshacer.
            </Text>
            <HStack justify="flex-end">
              <Button variant="outline" onClick={deleteDisclosure.onClose}>
                Cancelar
              </Button>
              <Button colorPalette="red" loading={deleteLoading} onClick={handleDelete}>
                Eliminar
              </Button>
            </HStack>
          </DialogBody>
        </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Box>
  )
}

function CategoryCard({
  category,
  readOnly = false,
  onEdit,
  onDelete,
}: {
  category: Category
  readOnly?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="#2d2d35"
      borderRadius="lg"
      p={4}
      bg="#1a1a23"
      _hover={{ shadow: 'md', bg: '#26262f' }}
      transition="box-shadow 0.15s, background-color 0.15s"
    >
      <HStack justify="space-between" align="start">
        <HStack gap={3}>
          <Box
            w="10"
            h="10"
            borderRadius="full"
            bg={category.color ?? 'gray.100'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="xl"
            flexShrink={0}
          >
            {category.icon ?? '🏷️'}
          </Box>
          <Box>
            <Text fontWeight="medium" fontSize="sm" color="white">
              {category.name}
            </Text>
            <Badge
              colorPalette={category.type === 'income' ? 'green' : 'red'}
              size="sm"
              mt={1}
            >
              {category.type === 'income' ? 'Ingreso' : 'Gasto'}
            </Badge>
          </Box>
        </HStack>

        {!readOnly && (
          <HStack gap={1}>
            <IconButton size="xs" variant="ghost" colorPalette="gray" aria-label="Editar" onClick={onEdit}>
              <FiEdit2 />
            </IconButton>
            <IconButton size="xs" variant="ghost" colorPalette="red" aria-label="Eliminar" onClick={onDelete}>
              <FiTrash2 />
            </IconButton>
          </HStack>
        )}
      </HStack>
    </Box>
  )
}
