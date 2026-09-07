'use client'

import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import { seriesColor, TEXT_MUTED } from './nivo-theme'
import type { Currency } from '@/types/database.types'

interface Props {
  data: { threshold: number; ant: number; rest: number; count: number }
  totalExpense: number
  currency: Currency
}

/**
 * A single share deserves a hero number, not a chart — the bar below is the
 * whole plot it needs.
 */
export function AntExpensesCard({ data, totalExpense, currency }: Props) {
  const share = safeRatio(data.ant, totalExpense) * 100

  return (
    <Card>
      <VStack align="stretch" gap={3} h="full" justify="center">
        <Text fontSize="sm" fontWeight="600" color="white">
          Gastos Hormiga
        </Text>
        <Text fontSize="xs" color="#B0B0B0">
          Compras sueltas por debajo de {formatCurrency(data.threshold, currency)}
        </Text>

        <Text fontSize="4xl" fontWeight="bold" color={seriesColor(1)} lineHeight="1.1">
          {share.toFixed(1)}%
        </Text>
        <Text fontSize="sm" color="#B0B0B0">
          {formatCurrency(data.ant, currency)} en {data.count}{' '}
          {data.count === 1 ? 'compra' : 'compras'}
        </Text>

        <Box w="full" h="2" bg="#22222c" borderRadius="md" overflow="hidden">
          <Box h="full" w={`${Math.min(share, 100)}%`} bg={seriesColor(1)} />
        </Box>

        <HStack justify="space-between" fontSize="xs" color={TEXT_MUTED}>
          <Text>Hormiga</Text>
          <Text>Resto: {formatCurrency(data.rest, currency)}</Text>
        </HStack>
      </VStack>
    </Card>
  )
}
