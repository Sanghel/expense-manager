'use client'

import { VStack, HStack, Box, Text, Icon } from '@chakra-ui/react'
import { useMemo } from 'react'
import { FiInfo, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import type { Category, SavingsInsight, AdviceSeverity } from '@/types/database.types'

const SEVERITY: Record<AdviceSeverity, { color: string; icon: IconType; label: string }> = {
  info: { color: 'brand', icon: FiInfo, label: 'Info' },
  warning: { color: 'warn', icon: FiAlertTriangle, label: 'Atención' },
  critical: { color: 'neg', icon: FiAlertOctagon, label: 'Crítico' },
}

interface Props {
  insights: SavingsInsight[]
  categories?: Category[]
}

export function InsightsList({ insights, categories = [] }: Props) {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  if (insights.length === 0) {
    return <Text color="text2">No hay observaciones para este periodo.</Text>
  }

  return (
    <VStack gap={3} align="stretch">
      {insights.map((insight, i) => {
        const s = SEVERITY[insight.severity] ?? SEVERITY.info
        const category = insight.category_id ? categoryMap.get(insight.category_id) : undefined
        return (
          <Box
            key={i}
            borderWidth="1px"
            borderLeftWidth="4px"
            borderRadius="lg"
            borderColor="line"
            borderLeftColor={s.color}
            bg="surface"
            p={4}
          >
            <HStack align="start" gap={3}>
              <Icon as={s.icon} color={s.color} boxSize={5} mt={0.5} flexShrink={0} />
              <Box>
                <HStack gap={2}>
                  {category?.icon && <Text fontSize="md">{category.icon}</Text>}
                  <Text fontWeight="semibold" color="text">
                    {insight.title}
                  </Text>
                </HStack>
                <Text fontSize="sm" color="text2" mt={1}>
                  {insight.detail}
                </Text>
              </Box>
            </HStack>
          </Box>
        )
      })}
    </VStack>
  )
}
