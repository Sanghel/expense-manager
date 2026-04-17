'use client'

import { VStack, Heading, Box, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { getTags, deleteTag } from '@/lib/actions/tags.actions'
import { TagBadge } from '@/components/tags/TagBadge'
import { Button, HStack } from '@chakra-ui/react'
import { toaster } from '@/lib/toaster'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Tag } from '@/types/database.types'

interface Props {
  userId: string
}

export function TagsPageContent({ userId }: Props) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadTags = useCallback(async () => {
    setLoading(true)
    const result = await getTags(userId)
    if (result.success) {
      setTags(result.data || [])
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 3000 })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const handleDelete = (tagId: string) => {
    setDeletingTagId(tagId)
  }

  const confirmDelete = async () => {
    if (!deletingTagId) return
    setDeleteLoading(true)
    const result = await deleteTag(deletingTagId, userId)
    setDeleteLoading(false)
    setDeletingTagId(null)
    if (result.success) {
      toaster.create({ title: 'Etiqueta eliminada', type: 'success', duration: 3000 })
      loadTags()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 3000 })
    }
  }

  if (loading) return <Text>Cargando...</Text>

  return (
    <>
      <VStack alignItems="flex-start" gap={6}>
        <Heading size="lg">Gestión de Etiquetas</Heading>

        {tags.length === 0 ? (
          <Text color="fg.muted">No hay etiquetas. Créalas al editar transacciones.</Text>
        ) : (
          <Box width="100%">
            <HStack flexWrap="wrap" gap={2}>
              {tags.map(tag => (
                <HStack key={tag.id} gap={2}>
                  <TagBadge tag={tag} />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDelete(tag.id)}
                    colorScheme="red"
                  >
                    Eliminar
                  </Button>
                </HStack>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>

      <ConfirmDialog
        isOpen={deletingTagId !== null}
        onClose={() => setDeletingTagId(null)}
        onConfirm={confirmDelete}
        title="Eliminar etiqueta"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={deleteLoading}
      />
    </>
  )
}
