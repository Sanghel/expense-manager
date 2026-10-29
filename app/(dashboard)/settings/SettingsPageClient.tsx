'use client'

import { Suspense, use } from 'react'
import { Box, Heading, HStack, VStack, Text, Separator, Tabs, Icon } from '@chakra-ui/react'
import { FiSliders, FiBriefcase, FiTag } from 'react-icons/fi'
import { CurrencySelector } from '@/components/settings/CurrencySelector'
import { ExchangeRatesForm } from '@/components/settings/ExchangeRatesForm'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { GmailConnectionPanel } from '@/components/settings/GmailConnectionPanel'
import { CategoriesPageClient } from '../categories/CategoriesPageClient'
import { TabSkeleton } from '@/components/ui/Skeletons'
import { useUrlParams } from '@/hooks/useUrlParams'
import { parseSettingsTab, type CategoriasData, type CuentasData } from './tabs'
import type { Currency, ExchangeRate } from '@/types/database.types'

interface Props {
  userId: string
  preferredCurrency: Currency
  initialRates: ExchangeRate[]
  cuentas: Promise<CuentasData>
  categorias: Promise<CategoriasData>
  gmailStatus: {
    enabled: boolean
    connected: boolean
    connectedAt: string | null
    lastSyncedAt: string | null
  }
}

function CuentasTab({ data, userId }: { data: Promise<CuentasData>; userId: string }) {
  const { accounts, movements } = use(data)
  return <AccountsTab userId={userId} initialAccounts={accounts} initialMovements={movements} />
}

function CategoriasTab({ data, userId }: { data: Promise<CategoriasData>; userId: string }) {
  const { categories, groups } = use(data)
  return <CategoriesPageClient userId={userId} initialCategories={categories} initialGroups={groups} />
}

export function SettingsPageClient({
  userId,
  preferredCurrency,
  initialRates,
  cuentas,
  categorias,
  gmailStatus,
}: Props) {
  const { searchParams, setParams } = useUrlParams()
  const activeTab = parseSettingsTab(searchParams.get('tab'))

  return (
    <Box>
      <HStack gap={2} mb={8}>
        <Icon as={FiSliders} color="#6366f1" boxSize={6} />
        <Heading size="lg" color="white">
          Configuración
        </Heading>
      </HStack>

      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => setParams({ tab: value })}
        colorPalette="brand"
        lazyMount
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
            <Icon as={FiSliders} boxSize={4} />
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
            <Icon as={FiBriefcase} boxSize={4} />
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
            <Icon as={FiTag} boxSize={4} />
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

            {gmailStatus.enabled && (
              <>
                <Separator />

                <GmailConnectionPanel
                  connected={gmailStatus.connected}
                  connectedAt={gmailStatus.connectedAt}
                  lastSyncedAt={gmailStatus.lastSyncedAt}
                />
              </>
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="accounts">
          <Suspense fallback={<TabSkeleton />}>
            <CuentasTab data={cuentas} userId={userId} />
          </Suspense>
        </Tabs.Content>

        <Tabs.Content value="categorias">
          <Suspense fallback={<TabSkeleton />}>
            <CategoriasTab data={categorias} userId={userId} />
          </Suspense>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
