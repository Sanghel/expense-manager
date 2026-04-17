'use client'

import {
  Box,
  Heading,
  Table,
  Badge,
  Text,
} from '@chakra-ui/react'
import { formatCurrency } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  limit?: number
}

export function RecentTransactions({ transactions, limit = 10 }: Props) {
  const displayedTransactions = transactions.slice(0, limit)

  if (displayedTransactions.length === 0) {
    return (
      <Card>
        <Heading size="md" mb={4}>Últimas Transacciones</Heading>
        <Text color="#B0B0B0">No hay transacciones registradas.</Text>
      </Card>
    )
  }

  return (
    <Card>
      <Heading size="md" mb={4}>Últimas Transacciones</Heading>
      <Box overflowX="auto">
        <Table.Root variant="line" size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Fecha</Table.ColumnHeader>
              <Table.ColumnHeader>Descripción</Table.ColumnHeader>
              <Table.ColumnHeader>Categoría</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {displayedTransactions.map((transaction) => (
              <Table.Row key={transaction.id}>
                <Table.Cell>
                  {new Date(transaction.date).toLocaleDateString('es-CO')}
                </Table.Cell>
                <Table.Cell>{transaction.description}</Table.Cell>
                <Table.Cell>
                  <Badge
                    colorPalette={transaction.type === 'income' ? 'green' : 'red'}
                  >
                    {transaction.category.name}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="right" fontWeight="semibold">
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(Number(transaction.amount), transaction.currency)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Card>
  )
}
