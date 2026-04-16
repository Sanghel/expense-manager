'use client'

import {
  Box,
  Table,
  Text,
  HStack,
  Button,
  Badge,
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
  IconButton,
} from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { getRecurringTransactions, deleteRecurringTransaction, toggleRecurringTransaction } from '@/lib/actions/recurring.actions'
import { toaster } from '@/lib/toaster'
import type { RecurringTransactionWithCategory } from '@/types/database.types'

interface Props {
  userId: string
  refresh: number
}

export function RecurringTransactionsList({ userId, refresh }: Props) {
  const [transactions, setTransactions] = useState<RecurringTransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    const result = await getRecurringTransactions(userId)
    if (result.success) {
      setTransactions(result.data || [])
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions, refresh])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    const result = await deleteRecurringTransaction(id, userId)
    if (result.success) {
      toaster.success({ title: 'Deleted' })
      loadTransactions()
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    const result = await toggleRecurringTransaction(id, userId, !isActive)
    if (result.success) {
      toaster.success({ title: isActive ? 'Paused' : 'Activated' })
      loadTransactions()
    } else {
      toaster.error({ title: result.error || 'Error' })
    }
  }

  if (loading) return <Text>Loading...</Text>

  if (transactions.length === 0) {
    return <Text color="fg.muted">No recurring transactions</Text>
  }

  return (
    <Box overflowX="auto">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
            <Table.ColumnHeader>Frequency</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map(txn => (
            <Table.Row key={txn.id}>
              <Table.Cell>{txn.description}</Table.Cell>
              <Table.Cell>{txn.category.name}</Table.Cell>
              <Table.Cell>
                {txn.amount.toLocaleString()} {txn.currency}
              </Table.Cell>
              <Table.Cell>{txn.frequency}</Table.Cell>
              <Table.Cell>
                <Badge variant={txn.is_active ? 'solid' : 'outline'}>
                  {txn.is_active ? 'Active' : 'Paused'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <HStack gap="2">
                  <Button
                    size="sm"
                    onClick={() => handleToggle(txn.id, txn.is_active)}
                  >
                    {txn.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <MenuRoot>
                    <MenuTrigger asChild>
                      <IconButton aria-label="Options" variant="ghost" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem value="delete" onClick={() => handleDelete(txn.id)}>
                        Delete
                      </MenuItem>
                    </MenuContent>
                  </MenuRoot>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
