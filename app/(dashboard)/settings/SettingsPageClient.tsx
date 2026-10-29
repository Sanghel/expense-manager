'use client'

import { Suspense, use } from 'react'
import { Box, Grid, Stack, Tabs } from '@chakra-ui/react'
import { CurrencySelector } from '@/components/settings/CurrencySelector'
import { ExchangeRatesForm } from '@/components/settings/ExchangeRatesForm'
import { AccountsTab } from '@/components/settings/AccountsTab'
import { GmailConnectionPanel } from '@/components/settings/GmailConnectionPanel'
import { AppearanceSelector } from '@/components/settings/AppearanceSelector'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { GmailSyncButton } from '@/components/transactions/GmailSyncButton'
import { CategoriesPageClient } from '../categories/CategoriesPageClient'
import { TabSkeleton } from '@/components/ui/Skeletons'
import { PageHeader } from '@/components/ui/PageHeader'
import { todayEyebrow } from '@/lib/utils/dates'
import { useUrlParams } from '@/hooks/useUrlParams'
import { parseSettingsTab, type CategoriasData, type CuentasData, type SettingsTab } from './tabs'
import type { Account, Category, Currency, ExchangeRate } from '@/types/database.types'

interface Props {
  userId: string
  preferredCurrency: Currency
  initialRates: ExchangeRate[]
  categories: Category[]
  accounts: Account[]
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
  categories,
  accounts,
  cuentas,
  categorias,
  gmailStatus,
}: Props) {
  const { searchParams, setParams } = useUrlParams()
  const activeTab = parseSettingsTab(searchParams.get('tab'))

  return (
    <Box>
      <PageHeader<SettingsTab>
        eyebrow={todayEyebrow()}
        title="Ajustes"
        tabs={[
          { value: 'general', label: 'General' },
          { value: 'accounts', label: 'Cuentas' },
          { value: 'categorias', label: 'Categorías' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setParams({ tab })}
      />

      <Tabs.Root value={activeTab} lazyMount>
        <Tabs.Content value="general" p={0}>
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4} alignItems="start">
            <Stack gap={4}>
              <SettingsSection
                title="Moneda preferida"
                description="Se usa como moneda principal en el resumen y los reportes."
              >
                <CurrencySelector userId={userId} current={preferredCurrency} />
              </SettingsSection>

              <SettingsSection title="Apariencia" description="Se guarda en tu perfil y se aplica en todos tus dispositivos.">
                <AppearanceSelector userId={userId} />
              </SettingsSection>

              {gmailStatus.enabled && (
                <GmailConnectionPanel
                  connected={gmailStatus.connected}
                  connectedAt={gmailStatus.connectedAt}
                  lastSyncedAt={gmailStatus.lastSyncedAt}
                  syncButton={
                    <GmailSyncButton userId={userId} categories={categories} accounts={accounts} variant="button" />
                  }
                />
              )}
            </Stack>

            <SettingsSection
              title="Tasas de cambio"
              description="Se actualizan solas cada día."
              aside={
                <Box as="span" textStyle="sectionLabel" color="text3" flexShrink={0}>
                  Auto · 12:00 COT
                </Box>
              }
            >
              <ExchangeRatesForm initialRates={initialRates} />
            </SettingsSection>
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="accounts" p={0}>
          <Suspense fallback={<TabSkeleton />}>
            <CuentasTab data={cuentas} userId={userId} />
          </Suspense>
        </Tabs.Content>

        <Tabs.Content value="categorias" p={0}>
          <Suspense fallback={<TabSkeleton />}>
            <CategoriasTab data={categorias} userId={userId} />
          </Suspense>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
