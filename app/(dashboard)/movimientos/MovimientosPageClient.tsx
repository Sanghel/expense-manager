'use client'

import { useTransition, useState, useEffect } from 'react'
import { Box, Heading, HStack, Tabs, Spinner, Icon } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiList, FiCreditCard, FiBell, FiActivity } from 'react-icons/fi'
import { TransactionsPageClient } from '../transactions/TransactionsPageClient'
import { LoansPageClient } from '../loans/LoansPageClient'
import { RecordatoriosTab } from '@/components/reminders/RecordatoriosTab'
import type {
  Account,
  Category,
  TransactionWithCategory,
  LoanWithAccount,
  ReminderWithCategory,
} from '@/types/database.types'

type Tab = 'transacciones' | 'prestamos' | 'recordatorios'

interface Props {
  userId: string
  activeTab: Tab
  categories: Category[]
  accounts: Account[]
  initialTransactions: TransactionWithCategory[] | null
  initialLoans: LoanWithAccount[] | null
  initialReminders: ReminderWithCategory[] | null
  todaysTransactions: { description: string; category_id: string | null }[]
}

export function MovimientosPageClient({
  userId,
  activeTab,
  categories,
  accounts,
  initialTransactions,
  initialLoans,
  initialReminders,
  todaysTransactions,
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
      router.push(`/movimientos?tab=${tab}`)
    })
  }

  const tabIcon = (tab: string, IconComponent: React.ElementType) =>
    pendingTab === tab && isPending ? (
      <Spinner
        w={4}
        h={4}
        borderWidth="2px"
        borderColor="rgba(255,255,255,0.3)"
        borderTopColor="white"
        animationDuration="0.65s"
        flexShrink={0}
      />
    ) : (
      <Icon as={IconComponent} boxSize={4} flexShrink={0} />
    )

  return (
    <Box>
      <HStack gap={2} mb={6}>
        <Icon as={FiActivity} color="#6366f1" boxSize={6} />
        <Heading size="lg" color="white">
          Movimientos
        </Heading>
      </HStack>

      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => handleTabChange(value)}
        colorPalette="brand"
      >
        <Tabs.List
          mb={6}
          borderBottomWidth="1px"
          borderColor="#2d2d35"
          overflowX="auto"
          flexWrap="nowrap"
          css={{ '&::-webkit-scrollbar': { display: 'none' } }}
        >
          <Tabs.Trigger
            value="transacciones"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            flexShrink={0}
            whiteSpace="nowrap"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('transacciones', FiList)}
            Transacciones
          </Tabs.Trigger>
          <Tabs.Trigger
            value="prestamos"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            flexShrink={0}
            whiteSpace="nowrap"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('prestamos', FiCreditCard)}
            Préstamos
          </Tabs.Trigger>
          <Tabs.Trigger
            value="recordatorios"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            flexShrink={0}
            whiteSpace="nowrap"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('recordatorios', FiBell)}
            Recordatorios
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="transacciones">
          {initialTransactions !== null && (
            <TransactionsPageClient
              userId={userId}
              categories={categories}
              initialTransactions={initialTransactions}
              accounts={accounts}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="prestamos">
          {initialLoans !== null && (
            <LoansPageClient
              userId={userId}
              initialLoans={initialLoans}
              accounts={accounts}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="recordatorios">
          {initialReminders !== null && (
            <RecordatoriosTab
              userId={userId}
              categories={categories}
              accounts={accounts}
              initialReminders={initialReminders}
              todaysTransactions={todaysTransactions}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
