'use client'

import { HStack, Text, Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { convertCurrency } from '@/lib/actions/exchangeRates.actions'
import { formatCurrency } from '@/lib/utils/currency'
import { useDebounce } from '@/hooks/useDebounce'
import type { Currency } from '@/types/database.types'

const OTHER_CURRENCIES: Currency[] = ['COP', 'USD', 'VES']

/** COP has no cents in practice; USD/VES keep them. */
const decimalsFor = (currency: string) => (currency === 'COP' ? 0 : 2)

interface Props {
  amount: number
  fromCurrency: Currency
  /**
   * `inline`: one centered mono line ("≈ US$ 14,32 · Bs 131.131"); with no
   * amount it shows the day's rate instead. `box` (default): labeled panel.
   */
  variant?: 'box' | 'inline'
}

export function CurrencyPreview({ amount, fromCurrency, variant = 'box' }: Props) {
  const [conversions, setConversions] = useState<Record<string, number>>({})
  const [rate, setRate] = useState<{ from: Currency; to: Currency; value: number } | null>(null)
  // Conversions hit the server; wait until the user stops typing.
  const debouncedAmount = useDebounce(amount, 300)

  useEffect(() => {
    // With no amount the stale conversions are simply not shown (see below).
    if (!debouncedAmount || debouncedAmount <= 0) return
    let cancelled = false

    const targets = OTHER_CURRENCIES.filter((c) => c !== fromCurrency)
    Promise.all(
      targets.map(async (to) => [to, await convertCurrency(debouncedAmount, fromCurrency, to)] as const)
    ).then((results) => {
      if (!cancelled) setConversions(Object.fromEntries(results))
    })
    return () => {
      cancelled = true
    }
  }, [debouncedAmount, fromCurrency])

  useEffect(() => {
    if (variant !== 'inline') return
    let cancelled = false
    // "1 USD = COP 3.143" (or USD → COP when the form is already in USD).
    const from: Currency = 'USD'
    const to: Currency = fromCurrency === 'USD' ? 'COP' : fromCurrency
    convertCurrency(1, from, to).then((value) => {
      if (!cancelled) setRate({ from, to, value })
    })
    return () => {
      cancelled = true
    }
  }, [variant, fromCurrency])

  const hasConversions = amount > 0 && Object.keys(conversions).length > 0

  if (variant === 'inline') {
    return (
      <Text fontFamily="mono" fontSize="13px" color="text3" textAlign="center" minH="20px">
        {hasConversions
          ? `≈ ${Object.entries(conversions)
              .map(([currency, value]) => formatCurrency(value, currency, decimalsFor(currency)))
              .join(' · ')}`
          : rate
            ? `Tasa de hoy · 1 ${rate.from} = ${formatCurrency(rate.value, rate.to, decimalsFor(rate.to))}`
            : null}
      </Text>
    )
  }

  if (!hasConversions) return null

  return (
    <Box bg="surface2" borderRadius="input" px={3} py={2} w="full">
      <Text textStyle="sectionLabel" color="text3" mb={1}>Equivalente aproximado</Text>
      <HStack gap={4} flexWrap="wrap">
        {Object.entries(conversions).map(([currency, value]) => (
          <Text key={currency} fontFamily="mono" fontSize="sm" color="text">
            {formatCurrency(value, currency)}
          </Text>
        ))}
      </HStack>
    </Box>
  )
}
