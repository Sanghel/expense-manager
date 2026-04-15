'use client'

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useToast,
  Text,
} from '@chakra-ui/react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useRef, useState } from 'react'
import { deleteTransaction } from '@/lib/actions/transactions.actions'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  userId: string
  onUpdate: () => void
  onEdit: (transaction: TransactionWithCategory) => void
}

export function TransactionsTable({ transactions, userId, onUpdate, onEdit }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()

  const handleDeleteClick = (id: string) => {
    setSelectedId(id)
    onOpen()
  }

  const handleDelete = async () => {
    if (!selectedId) return

    const result = await deleteTransaction(selectedId, userId)

    if (result.success) {
      toast({ title: 'Transacción eliminada', status: 'success', duration: 3000 })
      onUpdate()
    } else {
      toast({ title: 'Error', description: result.error, status: 'error', duration: 4000 })
    }
    onClose()
    setSelectedId(null)
  }

  if (transactions.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        No hay transacciones. ¡Crea una nueva!
      </Text>
    )
  }

  return (
    <>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Fecha</Th>
            <Th>Descripción</Th>
            <Th>Categoría</Th>
            <Th>Tipo</Th>
            <Th isNumeric>Monto</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {transactions.map((transaction) => (
            <Tr key={transaction.id}>
              <Td whiteSpace="nowrap">
                {new Date(transaction.date + 'T00:00:00').toLocaleDateString('es-CO')}
              </Td>
              <Td>{transaction.description}</Td>
              <Td>
                {transaction.category.icon} {transaction.category.name}
              </Td>
              <Td>
                <Badge colorScheme={transaction.type === 'income' ? 'green' : 'red'}>
                  {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                </Badge>
              </Td>
              <Td isNumeric fontWeight="semibold" color={transaction.type === 'income' ? 'green.600' : 'red.600'}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(Number(transaction.amount), transaction.currency)}
              </Td>
              <Td>
                <HStack spacing={1}>
                  <IconButton
                    aria-label="Editar"
                    icon={<FiEdit2 />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                  />
                  <IconButton
                    aria-label="Eliminar"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteClick(transaction.id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Transacción
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}
