'use client'

import { VStack, HStack, Box, Text, Icon } from '@chakra-ui/react'
import { FiInfo, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import type { SavingsInsight, AdviceSeverity } from '@/types/database.types'

const SEVERITY: Record<AdviceSeverity, { color: string; icon: IconType; label: string }> = {
  info: { color: '#6366f1', icon: FiInfo, label: 'Info' },
  warning: { color: '#d97706', icon: FiAlertTriangle, label: 'Atención' },
  critical: { color: '#dc2626', icon: FiAlertOctagon, label: 'Crítico' },
}

interface Props {
  insights: SavingsInsight[]
}

export function InsightsList({ insights }: Props) {
  if (insights.length === 0) {
    return <Text color="#B0B0B0">No hay observaciones para este periodo.</Text>
  }

  return (
    <VStack gap={3} align="stretch">
      {insights.map((insight, i) => {
        const s = SEVERITY[insight.severity] ?? SEVERITY.info
        return (
          <Box
            key={i}
            borderWidth="1px"
            borderLeftWidth="4px"
            borderRadius="lg"
            borderColor="#2d2d35"
            borderLeftColor={s.color}
            bg="#1a1a23"
            p={4}
          >
            <HStack align="start" gap={3}>
              <Icon as={s.icon} color={s.color} boxSize={5} mt={0.5} flexShrink={0} />
              <Box>
                <Text fontWeight="semibold" color="white">
                  {insight.title}
                </Text>
                <Text fontSize="sm" color="#B0B0B0" mt={1}>
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
