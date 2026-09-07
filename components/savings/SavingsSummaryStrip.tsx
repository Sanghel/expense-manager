'use client'

import { useMemo } from 'react'
import { Box, HStack, Text } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { toNumber } from '@/lib/utils/numbers'
import type { Currency, ExchangeRate, SavingsGoal } from '@/types/database.types'

interface Props {
  goals: SavingsGoal[]
  preferredCurrency: Currency
  exchangeRates: ExchangeRate[]
}

export function SavingsSummaryStrip({ goals, preferredCurrency, exchangeRates }: Props) {
  const summary = useMemo(() => {
    const convert = (amount: number, from: Currency) => {
      if (from === preferredCurrency) return amount
      const rate = exchangeRates.find(
        (r) => r.from_currency === from && r.to_currency === preferredCurrency
      )
      return rate ? amount * toNumber(rate.rate, 1) : amount
    }

    let saved = 0
    let target = 0
    let completed = 0

    for (const goal of goals) {
      saved += convert(toNumber(goal.current_amount), goal.currency)
      target += convert(toNumber(goal.target_amount), goal.currency)
      if (goal.is_completed) completed += 1
    }

    return { saved, target, completed, active: goals.length - completed }
  }, [goals, preferredCurrency, exchangeRates])

  if (goals.length === 0) return null

  return (
    <Box
      w="full"
      bg="#1a1a23"
      borderWidth="1px"
      borderColor="#2d2d35"
      borderRadius="xl"
      px={4}
      py={3}
    >
      <HStack gap={2} flexWrap="wrap">
        <Text fontSize="sm" color="#B0B0B0">
          Ahorrado
        </Text>
        <Text fontSize="sm" fontWeight="600" color="white">
          {formatCurrency(summary.saved, preferredCurrency)}
        </Text>
        <Text fontSize="sm" color="#B0B0B0">
          de {formatCurrency(summary.target, preferredCurrency)}
        </Text>
        <Text fontSize="sm" color="#6b7280">·</Text>
        <Text fontSize="sm" color="#B0B0B0">
          {summary.active} {summary.active === 1 ? 'meta activa' : 'metas activas'}
        </Text>
        {summary.completed > 0 && (
          <>
            <Text fontSize="sm" color="#6b7280">·</Text>
            <Text fontSize="sm" color="#10B981">
              {summary.completed} {summary.completed === 1 ? 'completada' : 'completadas'}
            </Text>
          </>
        )}
      </HStack>
    </Box>
  )
}
