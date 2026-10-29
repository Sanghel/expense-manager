'use client'

import { Suspense, use } from 'react'
import { Box, Heading, HStack, Tabs, Icon } from '@chakra-ui/react'
import { FiList, FiCreditCard, FiBell, FiActivity } from 'react-icons/fi'
import { TransactionsPageClient } from '../transactions/TransactionsPageClient'
import { LoansPageClient } from '../loans/LoansPageClient'
import { RecordatoriosTab } from '@/components/reminders/RecordatoriosTab'
import { TabSkeleton } from '@/components/ui/Skeletons'
import { useUrlParams } from '@/hooks/useUrlParams'
import {
  parseMovimientosTab,
  type PrestamosData,
  type RecordatoriosData,
  type TransaccionesData,
} from './tabs'
import type { Account, Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  accounts: Account[]
  transacciones: Promise<TransaccionesData>
  prestamos: Promise<PrestamosData>
  recordatorios: Promise<RecordatoriosData>
  gmailSyncEnabled: boolean
}

function TransaccionesTab({
  data,
  ...props
}: Pick<Props, 'userId' | 'categories' | 'accounts' | 'gmailSyncEnabled'> & {
  data: Promise<TransaccionesData>
}) {
  const { transactions, budgets } = use(data)
  return <TransactionsPageClient {...props} initialTransactions={transactions} budgets={budgets} />
}

function PrestamosTab({
  data,
  ...props
}: Pick<Props, 'userId' | 'accounts'> & { data: Promise<PrestamosData> }) {
  return <LoansPageClient {...props} initialLoans={use(data)} />
}

function RecordatoriosContent({
  data,
  ...props
}: Pick<Props, 'userId' | 'categories' | 'accounts'> & { data: Promise<RecordatoriosData> }) {
  const { reminders, todaysTransactions } = use(data)
  return (
    <RecordatoriosTab {...props} initialReminders={reminders} todaysTransactions={todaysTransactions} />
  )
}

export function MovimientosPageClient({
  userId,
  categories,
  accounts,
  transacciones,
  prestamos,
  recordatorios,
  gmailSyncEnabled,
}: Props) {
  const { searchParams, setParams } = useUrlParams()
  const activeTab = parseMovimientosTab(searchParams.get('tab'))

  const tabIcon = (IconComponent: React.ElementType) => (
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

      {/* lazyMount: a tab renders on its first visit and then stays mounted,
          so coming back to it is instant and keeps its state. */}
      <Tabs.Root
        value={activeTab}
        onValueChange={({ value }) => setParams({ tab: value })}
        colorPalette="brand"
        lazyMount
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
            {tabIcon(FiList)}
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
            {tabIcon(FiCreditCard)}
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
            {tabIcon(FiBell)}
            Recordatorios
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="transacciones">
          <Suspense fallback={<TabSkeleton />}>
            <TransaccionesTab
              data={transacciones}
              userId={userId}
              categories={categories}
              accounts={accounts}
              gmailSyncEnabled={gmailSyncEnabled}
            />
          </Suspense>
        </Tabs.Content>

        <Tabs.Content value="prestamos">
          <Suspense fallback={<TabSkeleton />}>
            <PrestamosTab data={prestamos} userId={userId} accounts={accounts} />
          </Suspense>
        </Tabs.Content>

        <Tabs.Content value="recordatorios">
          <Suspense fallback={<TabSkeleton />}>
            <RecordatoriosContent
              data={recordatorios}
              userId={userId}
              categories={categories}
              accounts={accounts}
            />
          </Suspense>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
