'use client'

import { Box, Heading, VStack, Text, Separator } from '@chakra-ui/react'
import { CurrencySelector } from '@/components/settings/CurrencySelector'
import { ExchangeRatesForm } from '@/components/settings/ExchangeRatesForm'
import type { Currency, ExchangeRate } from '@/types/database.types'

interface Props {
  userId: string
  preferredCurrency: Currency
  initialRates: ExchangeRate[]
}

export function SettingsPageClient({ userId, preferredCurrency, initialRates }: Props) {
  return (
    <Box p={6} maxW="2xl">
      <Heading size="lg" mb={8}>Configuración</Heading>

      <VStack gap={8} align="stretch">
        {/* Moneda preferida */}
        <Box>
          <Text fontWeight="semibold" mb={1}>Moneda preferida</Text>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Se usará como moneda principal en el dashboard y reportes.
          </Text>
          <CurrencySelector userId={userId} current={preferredCurrency} />
        </Box>

        <Separator />

        {/* Tasas de cambio */}
        <Box>
          <Text fontWeight="semibold" mb={1}>Tasas de cambio</Text>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Actualiza las tasas manualmente. Los cambios aplican a partir de hoy.
          </Text>
          <ExchangeRatesForm initialRates={initialRates} />
        </Box>
      </VStack>
    </Box>
  )
}
