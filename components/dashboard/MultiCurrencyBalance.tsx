'use client'

import { HStack, Box, Text, Skeleton } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { convertCurrency } from '@/lib/actions/exchangeRates.actions'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

const CURRENCIES: Currency[] = ['COP', 'USD', 'VES']

interface Props {
  balance: number
  fromCurrency: Currency
}

export function MultiCurrencyBalance({ balance, fromCurrency }: Props) {
  const [conversions, setConversions] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    const targets = CURRENCIES.filter((c) => c !== fromCurrency)

    Promise.all(
      targets.map(async (to) => {
        const converted = await convertCurrency(balance, fromCurrency, to)
        return [to, converted] as [Currency, number]
      })
    ).then((results) => {
      setConversions(Object.fromEntries(results))
    })
  }, [balance, fromCurrency])

  if (conversions === null) {
    return (
      <HStack gap={4}>
        <Skeleton h="4" w="24" />
        <Skeleton h="4" w="24" />
      </HStack>
    )
  }

  return (
    <HStack gap={4} flexWrap="wrap">
      {Object.entries(conversions).map(([currency, value]) => (
        <Box key={currency} bg="#26262f" borderRadius="md" px={3} py={1}>
          <Text fontSize="xs" color="#B0B0B0">{currency}</Text>
          <Text fontSize="sm" fontWeight="medium" color="white">{formatCurrency(value, currency)}</Text>
        </Box>
      ))}
    </HStack>
  )
}
