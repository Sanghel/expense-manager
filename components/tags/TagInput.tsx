'use client'

import { VStack, HStack, Input, Button, Box } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { getTags, createTag } from '@/lib/actions/tags.actions'
import { toaster } from '@/lib/toaster'
import { TagBadge } from './TagBadge'
import type { Tag } from '@/types/database.types'

interface Props {
  userId: string
  onTagsChange: (tags: Tag[]) => void
  selectedTags?: Tag[]
}

export function TagInput({ userId, onTagsChange, selectedTags = [] }: Props) {
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadTags = async () => {
      const result = await getTags(userId)
      if (result.success) {
        setAllTags(result.data || [])
      }
    }
    loadTags()
  }, [userId])

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }
    const filtered = allTags.filter(
      tag =>
        tag.name.toLowerCase().includes(input.toLowerCase()) &&
        !selectedTags.find(t => t.id === tag.id)
    )
    setSuggestions(filtered)
  }, [input, allTags, selectedTags])

  const handleAddTag = useCallback((tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag])
      setInput('')
      setSuggestions([])
    }
  }, [selectedTags, onTagsChange])

  const handleCreateTag = async () => {
    if (!input.trim()) return
    setLoading(true)
    const result = await createTag(userId, { name: input, color: generateColor() })
    setLoading(false)
    if (result.success && result.data) {
      handleAddTag(result.data)
      const newAllTags = [...allTags, result.data]
      setAllTags(newAllTags)
      toaster.success({ title: 'Tag created' })
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId))
  }

  return (
    <VStack alignItems="flex-start" gap="2" width="100%">
      <Input
        placeholder="Search or create tags..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            if (suggestions.length > 0) {
              handleAddTag(suggestions[0])
            } else {
              handleCreateTag()
            }
          }
        }}
      />

      {input && suggestions.length === 0 && (
        <Button size="sm" onClick={handleCreateTag} loading={loading}>
          Create "{input}"
        </Button>
      )}

      {suggestions.length > 0 && (
        <Box borderWidth="1px" borderRadius="md" p="2" width="100%" maxH="200px" overflowY="auto">
          {suggestions.map(tag => (
            <Button
              key={tag.id}
              size="sm"
              variant="ghost"
              width="100%"
              justifyContent="flex-start"
              onClick={() => handleAddTag(tag)}
            >
              <TagBadge tag={tag} />
            </Button>
          ))}
        </Box>
      )}

      {selectedTags.length > 0 && (
        <HStack gap="2" flexWrap="wrap">
          {selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleRemoveTag(tag.id)}
            />
          ))}
        </HStack>
      )}
    </VStack>
  )
}

function generateColor() {
  const colors = ['#3182CE', '#38A169', '#DD6B20', '#D69E2E', '#7C2D12', '#5B21B6']
  return colors[Math.floor(Math.random() * colors.length)]
}
