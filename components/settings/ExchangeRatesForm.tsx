'use client'

import { Box, Flex, Text } from '@chakra-ui/react'
import type { ExchangeRate, Currency } from '@/types/database.types'

const DISPLAY_PAIRS: Array<{ from: Currency; to: Currency; label: string }> = [
  { from: 'USD', to: 'COP', label: '1 USD → COP' },
  { from: 'COP', to: 'USD', label: '1 COP → USD' },
  { from: 'USD', to: 'VES', label: '1 USD → Bs' },
  { from: 'VES', to: 'USD', label: '1 Bs → USD' },
  { from: 'VES', to: 'COP', label: '1 Bs → COP' },
  { from: 'COP', to: 'VES', label: '1 COP → Bs' },
]

interface Props {
  initialRates: ExchangeRate[]
}

/** Read-only list of the day's rates (updated by a daily cron). */
export function ExchangeRatesForm({ initialRates }: Props) {
  return (
    <Box>
      {DISPLAY_PAIRS.map(({ from, to, label }) => {
        const r = initialRates.find((x) => x.from_currency === from && x.to_currency === to)
        return (
          <Flex
            key={`${from}_${to}`}
            justify="space-between"
            align="baseline"
            gap={3}
            py={3}
            borderBottomWidth="1px"
            borderColor="line"
            _last={{ borderBottomWidth: 0 }}
          >
            <Text fontFamily="mono" fontSize="13px" color="text2">
              {label}
            </Text>
            <Flex align="baseline" gap={3}>
              <Text fontFamily="mono" fontSize="14px" fontWeight="500" color="text">
                {r ? r.rate.toLocaleString('es-CO', { maximumFractionDigits: 6 }) : '—'}
              </Text>
              <Text fontFamily="mono" fontSize="11px" color="text3" display={{ base: 'none', sm: 'inline' }}>
                {r?.date ?? ''}
              </Text>
            </Flex>
          </Flex>
        )
      })}
    </Box>
  )
}
