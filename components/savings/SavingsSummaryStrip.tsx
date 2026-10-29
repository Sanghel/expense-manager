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
    <Box w="full" bg="surface" borderRadius="tile" px={5} py={3.5}>
      <HStack gap={2} flexWrap="wrap" fontSize="13px" color="text2">
        <Text>Ahorrado</Text>
        <Text fontFamily="mono" color="text">
          {formatCurrency(summary.saved, preferredCurrency)}
        </Text>
        <Text>de</Text>
        <Text fontFamily="mono" color="text">
          {formatCurrency(summary.target, preferredCurrency)}
        </Text>
        <Text color="text3">·</Text>
        <Text>
          {summary.active} {summary.active === 1 ? 'meta activa' : 'metas activas'}
        </Text>
        {summary.completed > 0 && (
          <>
            <Text color="text3">·</Text>
            <Text color="pos">
              {summary.completed} {summary.completed === 1 ? 'completada' : 'completadas'}
            </Text>
          </>
        )}
      </HStack>
    </Box>
  )
}
