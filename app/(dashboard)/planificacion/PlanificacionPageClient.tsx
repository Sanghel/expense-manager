'use client'

import { useTransition, useState, useEffect } from 'react'
import { Box, Heading, Tabs, Spinner } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiTarget, FiPieChart } from 'react-icons/fi'
import { SavingsGoalsPageContent } from '@/components/savings/SavingsGoalsPageContent'
import { BudgetsPageClient } from '../budgets/BudgetsPageClient'
import type { Account, SavingsGoal, Category } from '@/types/database.types'

type Tab = 'metas' | 'presupuestos'

interface Props {
  userId: string
  activeTab: Tab
  initialGoals: SavingsGoal[] | null
  initialBudgets: unknown[] | null
  categories: Category[]
  accounts?: Account[]
}

export function PlanificacionPageClient({
  userId,
  activeTab,
  initialGoals,
  initialBudgets,
  categories,
  accounts = [],
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
      router.push(`/planificacion?tab=${tab}`)
    })
  }

  const tabIcon = (tab: string, Icon: React.ElementType) =>
    pendingTab === tab && isPending ? <Spinner size="xs" /> : <Icon />

  return (
    <Box>
      <Heading size="lg" mb={6} color="white">
        Planificación
      </Heading>

      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => handleTabChange(value)}
        colorPalette="brand"
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
            {tabIcon('metas', FiTarget)}
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
            {tabIcon('presupuestos', FiPieChart)}
            Presupuestos
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="metas">
          {initialGoals !== null && (
            <SavingsGoalsPageContent userId={userId} initialGoals={initialGoals} accounts={accounts} />
          )}
        </Tabs.Content>

        <Tabs.Content value="presupuestos">
          {initialBudgets !== null && (
            <BudgetsPageClient
              userId={userId}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialBudgets={initialBudgets as any[]}
              categories={categories}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
