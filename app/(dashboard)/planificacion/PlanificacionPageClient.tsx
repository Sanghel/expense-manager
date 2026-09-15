'use client'

import { useTransition, useState, useEffect } from 'react'
import { Box, Heading, HStack, Tabs, Spinner, Icon } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiTarget, FiPieChart, FiClipboard } from 'react-icons/fi'
import { SavingsGoalsPageContent } from '@/components/savings/SavingsGoalsPageContent'
import { BudgetsPageClient } from '../budgets/BudgetsPageClient'
import type {
  Account,
  SavingsGoal,
  Category,
  CategoryGroupWithMembers,
  Currency,
  ExchangeRate,
  BudgetWithSpent,
} from '@/types/database.types'

type Tab = 'metas' | 'presupuestos'

interface Props {
  userId: string
  activeTab: Tab
  vista: 'grupos' | 'categorias'
  initialGoals: SavingsGoal[] | null
  initialBudgets: BudgetWithSpent[] | null
  categories: Category[]
  categoryGroups?: CategoryGroupWithMembers[]
  accounts?: Account[]
  preferredCurrency: Currency
  exchangeRates: ExchangeRate[]
}

export function PlanificacionPageClient({
  userId,
  activeTab,
  vista,
  initialGoals,
  initialBudgets,
  categories,
  categoryGroups = [],
  accounts = [],
  preferredCurrency,
  exchangeRates,
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
      const qs = tab === 'presupuestos' ? `?tab=${tab}&vista=${vista}` : `?tab=${tab}`
      router.push(`/planificacion${qs}`)
    })
  }

  const tabIcon = (tab: string, Icon: React.ElementType) =>
    pendingTab === tab && isPending ? <Spinner size="xs" /> : <Icon />

  return (
    <Box>
      <HStack gap={2} mb={6}>
        <Icon as={FiClipboard} color="#6366f1" boxSize={6} />
        <Heading size="lg" color="white">
          Planificación
        </Heading>
      </HStack>

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
            <SavingsGoalsPageContent
              userId={userId}
              initialGoals={initialGoals}
              accounts={accounts}
              preferredCurrency={preferredCurrency}
              exchangeRates={exchangeRates}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="presupuestos">
          {initialBudgets !== null && (
            <BudgetsPageClient
              userId={userId}
              initialBudgets={initialBudgets}
              categories={categories}
              groups={categoryGroups}
              vista={vista}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
