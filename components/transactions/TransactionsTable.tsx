'use client'

import {
  Table,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Button,
  Text,
} from '@chakra-ui/react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useState } from 'react'
import { deleteTransaction } from '@/lib/actions/transactions.actions'
import { formatCurrency } from '@/lib/utils/currency'
import { toaster } from '@/lib/toaster'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  userId: string
  onUpdate: () => void
  onEdit: (transaction: TransactionWithCategory) => void
}

export function TransactionsTable({ transactions, userId, onUpdate, onEdit }: Props) {
  const { open, onOpen, onClose } = useDisclosure()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setSelectedId(id)
    onOpen()
  }

  const handleDelete = async () => {
    if (!selectedId) return

    const result = await deleteTransaction(selectedId, userId)

    if (result.success) {
      toaster.create({ title: 'Transacción eliminada', type: 'success', duration: 3000 })
      onUpdate()
    } else {
      toaster.create({ title: 'Error al eliminar', description: result.error, type: 'error', duration: 4000 })
    }
    onClose()
    setSelectedId(null)
  }

  if (transactions.length === 0) {
    return (
      <Text color="#B0B0B0" textAlign="center" py={8}>
        No hay transacciones. ¡Crea una nueva!
      </Text>
    )
  }

  return (
    <>
      <Table.Root variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Fecha</Table.ColumnHeader>
            <Table.ColumnHeader>Descripción</Table.ColumnHeader>
            <Table.ColumnHeader>Categoría</Table.ColumnHeader>
            <Table.ColumnHeader>Tipo</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">Monto</Table.ColumnHeader>
            <Table.ColumnHeader>Acciones</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map((transaction) => (
            <Table.Row key={transaction.id}>
              <Table.Cell whiteSpace="nowrap">
                {new Date(transaction.date + 'T00:00:00').toLocaleDateString('es-CO')}
              </Table.Cell>
              <Table.Cell>{transaction.description}</Table.Cell>
              <Table.Cell>
                {transaction.category.icon} {transaction.category.name}
              </Table.Cell>
              <Table.Cell>
                <Badge colorPalette={transaction.type === 'income' ? 'green' : 'red'}>
                  {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                </Badge>
              </Table.Cell>
              <Table.Cell
                textAlign="right"
                fontWeight="semibold"
                color={transaction.type === 'income' ? 'green.600' : 'red.600'}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(Number(transaction.amount), transaction.currency)}
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  <IconButton
                    aria-label="Editar"
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                  >
                    <FiEdit2 />
                  </IconButton>
                  <IconButton
                    aria-label="Eliminar"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => handleDeleteClick(transaction.id)}
                  >
                    <FiTrash2 />
                  </IconButton>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <DialogRoot
        open={open}
        onOpenChange={({ open: isOpen }) => !isOpen && onClose()}
        role="alertdialog"
      >
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Transacción</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            ¿Estás seguro? Esta acción no se puede deshacer.
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button colorPalette="red" onClick={handleDelete} ml={3}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  )
}
