'use client'

import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'

interface Props {
  title: string
  subtitle?: string
  /** Rendered to the right of the title — usually a headline figure. */
  headline?: React.ReactNode
  height?: number | string
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
}

export function ChartCard({
  title,
  subtitle,
  headline,
  height = 300,
  isEmpty,
  emptyMessage = 'Sin datos en el periodo seleccionado.',
  children,
}: Props) {
  return (
    <Card>
      <HStack justify="space-between" align="start" mb={subtitle ? 1 : 4} gap={3}>
        <VStack align="start" gap={0} minW={0}>
          <Heading size="sm" color="white">{title}</Heading>
          {subtitle && (
            <Text fontSize="xs" color="#B0B0B0">{subtitle}</Text>
          )}
        </VStack>
        {headline}
      </HStack>

      {isEmpty ? (
        <Box h={height} display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="sm" color="#6b7280">{emptyMessage}</Text>
        </Box>
      ) : (
        <Box h={height} mt={3}>{children}</Box>
      )}
    </Card>
  )
}
