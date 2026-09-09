'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, HStack, Text, Badge, Button, IconButton } from '@chakra-ui/react'
import { FiPlus, FiX } from 'react-icons/fi'
import { createCategoryGroup } from '@/lib/actions/categoryGroups.actions'
import { dismissSuggestion } from '@/lib/actions/savingsAdvice.actions'
import { toaster } from '@/lib/toaster'
import type {
  CategoryGroupWithMembers,
  SavingsGroupSuggestion,
} from '@/types/database.types'

interface Props {
  userId: string
  period: string
  suggestions: SavingsGroupSuggestion[]
  existingGroups: CategoryGroupWithMembers[]
}

/** Same normalisation the server uses, so "Gastos hormiga" matches "gastos hormiga". */
function normalize(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function GroupSuggestionsList({ userId, period, suggestions, existingGroups }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  const existingNames = new Set(existingGroups.map((g) => normalize(g.name)))
  // A group the user already created is not a suggestion any more.
  const pending = suggestions.filter((s) => !existingNames.has(normalize(s.name)))

  if (pending.length === 0) {
    return (
      <Text fontSize="sm" color="#6b7280">
        Sin grupos sugeridos para este periodo.
      </Text>
    )
  }

  const handleCreate = async (suggestion: SavingsGroupSuggestion) => {
    setBusy(suggestion.name)
    const result = await createCategoryGroup(userId, {
      name: suggestion.name,
      category_ids: suggestion.category_ids,
    })
    setBusy(null)

    if (result.success) {
      toaster.create({ title: `Grupo "${suggestion.name}" creado`, type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: result.error || 'Error', type: 'error', duration: 4000 })
    }
  }

  const handleDismiss = async (suggestion: SavingsGroupSuggestion) => {
    setBusy(suggestion.name)
    await dismissSuggestion(userId, period, 'group', suggestion.name)
    setBusy(null)
    router.refresh()
  }

  return (
    <VStack align="stretch" gap={3}>
      {pending.map((s) => (
        <Box
          key={s.name}
          borderWidth="1px"
          borderColor="#2d2d35"
          borderRadius="xl"
          bg="#1a1a23"
          p={4}
        >
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between" align="start" gap={2}>
              <Text fontWeight="600" color="white">📦 {s.name}</Text>
              <IconButton
                aria-label="Descartar"
                size="xs"
                variant="ghost"
                color="#6b7280"
                _hover={{ color: '#ef4444', bg: '#2d2d35' }}
                loading={busy === s.name}
                onClick={() => handleDismiss(s)}
              >
                <FiX />
              </IconButton>
            </HStack>

            <HStack gap={1} flexWrap="wrap">
              {s.category_names.map((name) => (
                <Badge key={name} size="sm" variant="outline" colorPalette="purple">
                  {name}
                </Badge>
              ))}
            </HStack>

            <Text fontSize="sm" color="#B0B0B0">{s.rationale}</Text>

            <Button
              size="sm"
              bg="#4F46E5"
              color="white"
              _hover={{ bg: '#4338CA' }}
              alignSelf="flex-start"
              loading={busy === s.name}
              onClick={() => handleCreate(s)}
            >
              <FiPlus />
              Crear grupo
            </Button>
          </VStack>
        </Box>
      ))}
    </VStack>
  )
}
