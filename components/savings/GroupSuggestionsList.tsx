'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, VStack, HStack, Text, Badge, Button } from '@chakra-ui/react'
import { LuPlus } from 'react-icons/lu'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
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
      <Text fontSize="sm" color="text3">
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
          borderColor="line"
          borderRadius="xl"
          bg="surface"
          p={4}
        >
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between" align="start" gap={2}>
              <Text fontWeight="600" color="text">📦 {s.name}</Text>
              <ActionIconButton
                kind="discard"
                label="Descartar"
                size="xs"
                variant="ghost"
                loading={busy === s.name}
                onClick={() => handleDismiss(s)}
              />
            </HStack>

            <HStack gap={1} flexWrap="wrap">
              {s.category_names.map((name) => (
                <Badge key={name} size="sm" variant="outline" colorPalette="purple">
                  {name}
                </Badge>
              ))}
            </HStack>

            <Text fontSize="sm" color="text2">{s.rationale}</Text>

            <Button
              size="sm"
              bg="brandSolid"
              color="white"
              _hover={{ bg: 'brand.600' }}
              alignSelf="flex-start"
              loading={busy === s.name}
              onClick={() => handleCreate(s)}
            >
              <LuPlus />
              Crear grupo
            </Button>
          </VStack>
        </Box>
      ))}
    </VStack>
  )
}
