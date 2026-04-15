'use client'

import {
  Box,
  Heading,
  Table,
  Badge,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getTransactions } from '@/lib/actions/transactions.actions'
import { formatCurrency } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  limit?: number
}

export function RecentTransactions({ userId, limit = 10 }: Props) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      const result = await getTransactions(userId, limit)
      if (result.success && result.data) {
        setTransactions(result.data as TransactionWithCategory[])
      }
      setLoading(false)
    }
    fetchTransactions()
  }, [userId, limit])

  if (loading) {
    return (
      <Card>
        <Center py={10}>
          <Spinner />
        </Center>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <Heading size="md" mb={4}>Últimas Transacciones</Heading>
        <Text color="gray.500">No hay transacciones registradas.</Text>
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
            {transactions.map((transaction) => (
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
