'use client'

import { Heading, Badge, Text } from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  limit?: number
}

const columns: ColumnDef<TransactionWithCategory>[] = [
  {
    key: 'date',
    header: 'Fecha',
    render: (t) => new Date(t.date).toLocaleDateString('es-CO'),
  },
  {
    key: 'description',
    header: 'Descripción',
    render: (t) => t.description,
  },
  {
    key: 'category',
    header: 'Categoría',
    render: (t) => (
      <Badge colorPalette={t.type === 'income' ? 'green' : 'red'}>
        {t.category.name}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Monto',
    textAlign: 'right',
    render: (t) => (
      <Text fontWeight="semibold">
        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency)}
      </Text>
    ),
  },
]

export function RecentTransactions({ transactions, limit = 10 }: Props) {
  const displayed = transactions.slice(0, limit)

  return (
    <Card>
      <Heading size="md" mb={4}>Últimas Transacciones</Heading>
      <DataTable
        data={displayed}
        columns={columns}
        emptyMessage="No hay transacciones registradas."
        size="sm"
      />
    </Card>
  )
}
