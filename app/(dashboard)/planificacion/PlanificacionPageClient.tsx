'use client'

import { Box, Heading, Tabs } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
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

  const handleTabChange = (tab: string) => {
    router.push(`/planificacion?tab=${tab}`)
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
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
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            Metas de Ahorro
          </Tabs.Trigger>
          <Tabs.Trigger
            value="presupuestos"
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
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
