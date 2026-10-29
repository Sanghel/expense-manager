'use client'

import { Suspense, use } from 'react'
import { Box, Tabs } from '@chakra-ui/react'
import { SavingsGoalsPageContent } from '@/components/savings/SavingsGoalsPageContent'
import { BudgetsPageClient } from '../budgets/BudgetsPageClient'
import { TabSkeleton } from '@/components/ui/Skeletons'
import { PageHeader } from '@/components/ui/PageHeader'
import { todayEyebrow } from '@/lib/utils/dates'
import { useUrlParams } from '@/hooks/useUrlParams'
import { parsePlanificacionTab, type MetasData, type PlanificacionTab, type PresupuestosData } from './tabs'
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
      <PageHeader<PlanificacionTab>
        eyebrow={todayEyebrow()}
        title="Planificación"
        tabs={[
          { value: 'metas', label: 'Metas' },
          { value: 'presupuestos', label: 'Presupuestos' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setParams({ tab })}
      />

      {/* lazyMount: a tab renders on its first visit and then stays mounted. */}
      <Tabs.Root value={activeTab} lazyMount>
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
