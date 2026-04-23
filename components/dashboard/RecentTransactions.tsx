'use client'

import { useState } from 'react'
import { Heading, Badge, Text, HStack, Button } from '@chakra-ui/react'
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
    render: (t) => new Date(t.date + 'T00:00:00').toLocaleDateString('es-CO'),
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
        <HStack gap={1}>
          <Text>{t.category.icon ?? '🏷️'}</Text>
          <Text>{t.category.name}</Text>
        </HStack>
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Monto',
    textAlign: 'right',
    render: (t) => (
      <Text fontWeight="semibold" color={t.type === 'income' ? '#10B981' : '#F43F5E'}>
        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), t.currency)}
      </Text>
    ),
  },
]

export function RecentTransactions({ transactions, limit = 10 }: Props) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(transactions.length / limit))
  const paginated = transactions.slice((page - 1) * limit, page * limit)

  return (
    <Card>
      <Heading size="md" mb={4}>Últimas Transacciones</Heading>
      <DataTable
        data={paginated}
        columns={columns}
        emptyMessage="No hay transacciones registradas."
        size="sm"
      />
      {totalPages > 1 && (
        <HStack justify="center" mt={4} gap={2}>
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <Text fontSize="sm" color="#B0B0B0">{page} / {totalPages}</Text>
          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </HStack>
      )}
    </Card>
  )
}
