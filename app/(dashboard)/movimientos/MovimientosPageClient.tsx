'use client'

import { Box, Heading, Tabs } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
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

  const handleTabChange = (tab: string) => {
    router.push(`/movimientos?tab=${tab}`)
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
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
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            Transacciones
          </Tabs.Trigger>
          <Tabs.Trigger
            value="recurrentes"
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
            Recurrentes
          </Tabs.Trigger>
          <Tabs.Trigger
            value="prestamos"
            color="#B0B0B0"
            _selected={{ color: 'white', borderBottomColor: '#6366f1' }}
          >
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
