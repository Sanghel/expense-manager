'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react'
import { FiArrowRight } from 'react-icons/fi'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { dismissSuggestion } from '@/lib/actions/savingsAdvice.actions'
import type { CategorySuggestionKind, SavingsCategorySuggestion } from '@/types/database.types'

interface Props {
  userId: string
  period: string
  suggestions: SavingsCategorySuggestion[]
}

const KIND: Record<CategorySuggestionKind, { label: string; palette: string }> = {
  merge: { label: 'Fusionar', palette: 'orange' },
  rename: { label: 'Renombrar', palette: 'blue' },
  categorize: { label: 'Categorizar', palette: 'red' },
  review: { label: 'Revisar', palette: 'gray' },
}

export function CategoryHygieneList({ userId, period, suggestions }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (suggestions.length === 0) {
    return (
      <Text fontSize="sm" color="#6b7280">
        Tus categorías están ordenadas. Nada que limpiar.
      </Text>
    )
  }

  const handleDismiss = async (title: string) => {
    setBusy(title)
    await dismissSuggestion(userId, period, 'category', title)
    setBusy(null)
    router.refresh()
  }

  return (
    <VStack align="stretch" gap={3}>
      {suggestions.map((s) => {
        const kind = KIND[s.kind] ?? KIND.review
        return (
          <Box
            key={s.title}
            borderWidth="1px"
            borderColor="#2d2d35"
            borderRadius="xl"
            bg="#1a1a23"
            p={4}
          >
            <VStack align="stretch" gap={2}>
              <HStack justify="space-between" align="start" gap={2}>
                <HStack gap={2} minW={0}>
                  <Badge size="sm" colorPalette={kind.palette} variant="subtle">
                    {kind.label}
                  </Badge>
                  <Text fontWeight="600" color="white" lineClamp={1}>{s.title}</Text>
                </HStack>
                <ActionIconButton
                  kind="discard"
                  label="Descartar"
                  size="xs"
                  variant="ghost"
                  loading={busy === s.title}
                  onClick={() => handleDismiss(s.title)}
                />
              </HStack>

              <Text fontSize="sm" color="#B0B0B0">{s.detail}</Text>

              {/* No automatic merge: reassigning transactions is destructive and
                  the user should see what changes before it happens. */}
              <Link
                href={s.kind === 'categorize' ? '/movimientos?tab=transacciones' : '/settings?tab=categorias'}
              >
                <HStack gap={1} color="#8B93FF" fontSize="xs">
                  <Text>{s.kind === 'categorize' ? 'Ir a transacciones' : 'Ir a categorías'}</Text>
                  <FiArrowRight />
                </HStack>
              </Link>
            </VStack>
          </Box>
        )
      })}
    </VStack>
  )
}
