'use client'

import { useTransition, useState, useEffect } from 'react'
import { Box, Heading, Tabs, Spinner, Icon } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiList, FiRepeat, FiCreditCard } from 'react-icons/fi'
import { TransactionsPageClient } from '../transactions/TransactionsPageClient'
import { RecurringTransactionsPageContent } from '@/components/recurring/RecurringTransactionsPageContent'
import { LoansPageClient } from '../loans/LoansPageClient'
import type {
  Account,
  Category,
  TransactionWithCategory,
  LoanWithAccount,
  RecurringTransactionWithCategory,
} from '@/types/database.types'

type Tab = 'transacciones' | 'recurrentes' | 'prestamos'

interface Props {
  userId: string
  activeTab: Tab
  categories: Category[]
  accounts: Account[]
  initialTransactions: TransactionWithCategory[] | null
  initialRecurring: RecurringTransactionWithCategory[] | null
  initialLoans: LoanWithAccount[] | null
}

export function MovimientosPageClient({
  userId,
  activeTab,
  categories,
  accounts,
  initialTransactions,
  initialRecurring,
  initialLoans,
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
      <Heading size="lg" mb={6} color="white">
        Movimientos
      </Heading>

      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => handleTabChange(value)}
        colorPalette="brand"
      >
        <Tabs.List mb={6} borderBottomWidth="1px" borderColor="#2d2d35">
          <Tabs.Trigger
            value="transacciones"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('transacciones', FiList)}
            Transacciones
          </Tabs.Trigger>
          <Tabs.Trigger
            value="recurrentes"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('recurrentes', FiRepeat)}
            Recurrentes
          </Tabs.Trigger>
          <Tabs.Trigger
            value="prestamos"
            display="flex"
            alignItems="center"
            gap={2}
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            {tabIcon('prestamos', FiCreditCard)}
            Préstamos
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

        <Tabs.Content value="recurrentes">
          {initialRecurring !== null && (
            <RecurringTransactionsPageContent
              userId={userId}
              categories={categories}
              accounts={accounts}
              initialTransactions={initialRecurring}
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
      </Tabs.Root>
    </Box>
  )
}
