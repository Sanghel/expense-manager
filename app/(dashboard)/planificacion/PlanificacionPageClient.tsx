'use client'

import { Suspense, use } from 'react'
import { Box, Heading, HStack, Tabs, Icon } from '@chakra-ui/react'
import { FiTarget, FiPieChart, FiClipboard } from 'react-icons/fi'
import { SavingsGoalsPageContent } from '@/components/savings/SavingsGoalsPageContent'
import { BudgetsPageClient } from '../budgets/BudgetsPageClient'
import { TabSkeleton } from '@/components/ui/Skeletons'
import { useUrlParams } from '@/hooks/useUrlParams'
import { parsePlanificacionTab, type MetasData, type PresupuestosData } from './tabs'
import type { Currency } from '@/types/database.types'

interface Props {
  userId: string
  metas: Promise<MetasData>
  presupuestos: Promise<PresupuestosData>
  preferredCurrency: Currency
}

function MetasTab({
  data,
  userId,
  preferredCurrency,
}: Pick<Props, 'userId' | 'preferredCurrency'> & { data: Promise<MetasData> }) {
  const { goals, accounts, exchangeRates } = use(data)
  return (
    <SavingsGoalsPageContent
      userId={userId}
      initialGoals={goals}
      accounts={accounts}
      preferredCurrency={preferredCurrency}
      exchangeRates={exchangeRates}
    />
  )
}

function PresupuestosTab({ data, userId }: Pick<Props, 'userId'> & { data: Promise<PresupuestosData> }) {
  const { budgets, categories, groups } = use(data)
  return (
    <BudgetsPageClient userId={userId} initialBudgets={budgets} categories={categories} groups={groups} />
  )
}

export function PlanificacionPageClient({ userId, metas, presupuestos, preferredCurrency }: Props) {
  const { searchParams, setParams } = useUrlParams()
  const activeTab = parsePlanificacionTab(searchParams.get('tab'))

  return (
    <Box>
      <HStack gap={2} mb={6}>
        <Icon as={FiClipboard} color="#6366f1" boxSize={6} />
        <Heading size="lg" color="white">
          Planificación
        </Heading>
      </HStack>

      {/* lazyMount: a tab renders on its first visit and then stays mounted. */}
      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => setParams({ tab: value })}
        colorPalette="brand"
        lazyMount
      >
        <Tabs.List mb={6} borderBottomWidth="1px" borderColor="#2d2d35">
          <Tabs.Trigger
            value="metas"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            <Icon as={FiTarget} />
            Metas de Ahorro
          </Tabs.Trigger>
          <Tabs.Trigger
            value="presupuestos"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            <Icon as={FiPieChart} />
            Presupuestos
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="metas">
          <Suspense fallback={<TabSkeleton />}>
            <MetasTab data={metas} userId={userId} preferredCurrency={preferredCurrency} />
          </Suspense>
        </Tabs.Content>

        <Tabs.Content value="presupuestos">
          <Suspense fallback={<TabSkeleton />}>
            <PresupuestosTab data={presupuestos} userId={userId} />
          </Suspense>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
