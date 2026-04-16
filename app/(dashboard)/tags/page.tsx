'use client'

import { VStack, Heading, Box, Text } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { getTags, deleteTag } from '@/lib/actions/tags.actions'
import { TagBadge } from '@/components/tags/TagBadge'
import { Button, HStack } from '@chakra-ui/react'
import { toaster } from '@/lib/toaster'
import type { Tag } from '@/types/database.types'

export default function TagsPage() {
  const { data: session } = useSession()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const loadTags = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    const result = await getTags(session.user.id)
    if (result.success) {
      setTags(result.data || [])
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
    setLoading(false)
  }, [session?.user?.id])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const handleDelete = async (tagId: string) => {
    if (!session?.user?.id) return
    if (!confirm('¿Eliminar esta etiqueta?')) return

    const result = await deleteTag(tagId, session.user.id)
    if (result.success) {
      toaster.success({ title: 'Etiqueta eliminada' })
      loadTags()
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
  }

  if (!session?.user?.id) return null
  if (loading) return <Text>Cargando...</Text>

  return (
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
  )
}
