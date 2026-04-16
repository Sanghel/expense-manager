'use client'

import { HStack, Text, Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { convertCurrency } from '@/lib/actions/exchangeRates.actions'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

const OTHER_CURRENCIES: Currency[] = ['COP', 'USD', 'VES']

interface Props {
  amount: number
  fromCurrency: Currency
}

export function CurrencyPreview({ amount, fromCurrency }: Props) {
  const [conversions, setConversions] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!amount || amount <= 0) {
      setConversions({})
      return
    }

    const targets = OTHER_CURRENCIES.filter((c) => c !== fromCurrency)

    Promise.all(
      targets.map(async (to) => {
        const converted = await convertCurrency(amount, fromCurrency, to)
        return [to, converted] as [Currency, number]
      })
    ).then((results) => {
      setConversions(Object.fromEntries(results))
    })
  }, [amount, fromCurrency])

  if (!amount || amount <= 0 || Object.keys(conversions).length === 0) return null

  return (
    <Box bg="#26262f" borderRadius="md" px={3} py={2} w="full">
      <Text fontSize="xs" color="#B0B0B0" mb={1}>Equivalente aproximado</Text>
      <HStack gap={4} flexWrap="wrap">
        {Object.entries(conversions).map(([currency, value]) => (
          <Text key={currency} fontSize="sm" color="white">
            {formatCurrency(value, currency)}
          </Text>
        ))}
      </HStack>
    </Box>
  )
}
