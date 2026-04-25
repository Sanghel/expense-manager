'use client'

import { useTransition, useState, useEffect } from 'react'
import { Box, Heading, VStack, Text, Separator, Tabs, Spinner } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiSliders, FiBriefcase, FiTag } from 'react-icons/fi'
import { CurrencySelector } from '@/components/settings/CurrencySelector'
import { ExchangeRatesForm } from '@/components/settings/ExchangeRatesForm'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { CategoriesPageClient } from '../categories/CategoriesPageClient'
import type {
  Currency,
  ExchangeRate,
  Account,
  AccountMovementWithAccounts,
  Category,
} from '@/types/database.types'

type Tab = 'general' | 'accounts' | 'categorias'

interface Props {
  userId: string
  preferredCurrency: Currency
  initialRates: ExchangeRate[]
  initialAccounts: Account[]
  initialMovements: AccountMovementWithAccounts[]
  activeTab: Tab
  initialCategories: Category[]
}

export function SettingsPageClient({
  userId,
  preferredCurrency,
  initialRates,
  initialAccounts,
  initialMovements,
  activeTab,
  initialCategories,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingTab, setPendingTab] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending) setPendingTab(null)
  }, [isPending])

  const handleTabChange = (tab: string) => {
    setPendingTab(tab)
    startTransition(() => {
      router.push(`/settings?tab=${tab}`)
    })
  }

  const tabIcon = (tab: string, Icon: React.ElementType) =>
    pendingTab === tab && isPending ? <Spinner size="xs" /> : <Icon />

  return (
    <Box p={6}>
      <Heading size="lg" mb={8} color="white">
        Configuración
      </Heading>

      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => handleTabChange(value)}
        colorPalette="brand"
        style={{ width: '100%' }}
      >
        <Tabs.List mb={6} borderBottomWidth="1px" borderColor="#2d2d35">
          <Tabs.Trigger
            value="general"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('general', FiSliders)}
            General
          </Tabs.Trigger>
          <Tabs.Trigger
            value="accounts"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('accounts', FiBriefcase)}
            Cuentas
          </Tabs.Trigger>
          <Tabs.Trigger
            value="categorias"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('categorias', FiTag)}
            Categorías
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
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="accounts">
          <AccountsTab
            userId={userId}
            initialAccounts={initialAccounts}
            initialMovements={initialMovements}
          />
        </Tabs.Content>

        <Tabs.Content value="categorias">
          {initialCategories.length >= 0 && (
            <CategoriesPageClient
              userId={userId}
              initialCategories={initialCategories}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
