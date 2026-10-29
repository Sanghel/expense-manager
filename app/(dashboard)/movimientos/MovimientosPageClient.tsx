'use client'

import { Suspense, use } from 'react'
import { Box, Tabs } from '@chakra-ui/react'
import { TransactionsPageClient } from '../transactions/TransactionsPageClient'
import { LoansPageClient } from '../loans/LoansPageClient'
import { RecordatoriosTab } from '@/components/reminders/RecordatoriosTab'
import { TabSkeleton } from '@/components/ui/Skeletons'
import { PageHeader } from '@/components/ui/PageHeader'
import { todayEyebrow } from '@/lib/utils/dates'
import { useUrlParams } from '@/hooks/useUrlParams'
import {
  parseMovimientosTab,
  type MovimientosTab,
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
  const { transactions } = use(data)
  return <TransactionsPageClient {...props} initialTransactions={transactions} />
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

  return (
    <Box>
      <PageHeader<MovimientosTab>
        eyebrow={todayEyebrow()}
        title="Movimientos"
        tabs={[
          { value: 'transacciones', label: 'Transacciones' },
          { value: 'prestamos', label: 'Préstamos' },
          { value: 'recordatorios', label: 'Recordatorios' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setParams({ tab })}
      />

      {/* lazyMount: a tab renders on its first visit and then stays mounted,
          so coming back to it is instant and keeps its state. */}
      <Tabs.Root value={activeTab} lazyMount>
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
