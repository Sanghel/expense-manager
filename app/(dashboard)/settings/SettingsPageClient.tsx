'use client'

import { Box, Heading, VStack, Text, Separator, Tabs } from '@chakra-ui/react'
import { CurrencySelector } from '@/components/settings/CurrencySelector'
import { ExchangeRatesForm } from '@/components/settings/ExchangeRatesForm'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { CronActionsPanel } from '@/components/settings/CronActionsPanel'
import type {
  Currency,
  ExchangeRate,
  Account,
  AccountMovementWithAccounts,
} from '@/types/database.types'

interface Props {
  userId: string
  preferredCurrency: Currency
  initialRates: ExchangeRate[]
  initialAccounts: Account[]
  initialMovements: AccountMovementWithAccounts[]
}

export function SettingsPageClient({
  userId,
  preferredCurrency,
  initialRates,
  initialAccounts,
  initialMovements,
}: Props) {
  return (
    <Box p={6}>
      <Heading size="lg" mb={8} color="white">
        Configuración
      </Heading>

      <Tabs.Root
        defaultValue="general"
        colorPalette="brand"
        style={{ width: '100%' }}
      >
        <Tabs.List mb={6} borderBottomWidth="1px" borderColor="#2d2d35">
          <Tabs.Trigger
            value="general"
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            General
          </Tabs.Trigger>
          <Tabs.Trigger
            value="accounts"
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            Cuentas
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="general">
          <VStack gap={8} align="stretch" maxW="2xl">
            <Box>
              <Text fontWeight="semibold" mb={1} color="white">
                Moneda preferida
              </Text>
              <Text fontSize="sm" color="#B0B0B0" mb={4}>
                Se usará como moneda principal en el dashboard y reportes.
              </Text>
              <CurrencySelector userId={userId} current={preferredCurrency} />
            </Box>

            <Separator />

            <Box>
              <Text fontWeight="semibold" mb={1} color="white">
                Tasas de cambio
              </Text>
              <Text fontSize="sm" color="#B0B0B0" mb={4}>
                Actualiza las tasas manualmente. Los cambios aplican a partir de
                hoy.
              </Text>
              <ExchangeRatesForm initialRates={initialRates} />
            </Box>

            <Separator />

            <Box>
              <Text fontWeight="semibold" mb={1} color="white">
                Mantenimiento
              </Text>
              <Text fontSize="sm" color="#B0B0B0" mb={4}>
                Ejecuta manualmente los procesos automáticos del sistema.
              </Text>
              <CronActionsPanel userId={userId} />
            </Box>
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="accounts">
          <AccountsTab
            userId={userId}
            initialAccounts={initialAccounts}
            initialMovements={initialMovements}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
