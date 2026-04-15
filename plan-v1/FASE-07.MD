# FASE 07: Gestión de Transacciones

## 🎯 Objetivo

Implementar CRUD completo de transacciones: formulario de creación, lista con filtros, edición y eliminación.

**Resultado:** Página de transacciones funcional con todas las operaciones CRUD.

---

## 📋 Inicio

```bash
git checkout develop && git pull
gh issue create --title "FASE 07: Gestión de Transacciones"
```

📝 Issue #50

---

## 📝 Tareas Principales

### Tarea 7.1: Crear formulario de nueva transacción

```bash
git checkout -b feature/51-transaction-form
```

Crear `components/transactions/TransactionForm.tsx`:

```typescript
'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { createTransaction } from '@/lib/actions/transactions.actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: any[]
  onSuccess: () => void
}

export function TransactionForm({ isOpen, onClose, userId, categories, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    currency: 'COP',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createTransaction(userId, {
      ...formData,
      amount: parseFloat(formData.amount),
    })

    if (result.success) {
      toast({ title: 'Transacción creada', status: 'success' })
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        currency: 'COP',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
    } else {
      toast({ title: 'Error', description: result.error, status: 'error' })
    }
    setLoading(false)
  }

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nueva Transacción</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tipo</FormLabel>
                <RadioGroup
                  value={formData.type}
                  onChange={(value: 'income' | 'expense') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <Stack direction="row">
                    <Radio value="expense" colorScheme="red">Gasto</Radio>
                    <Radio value="income" colorScheme="green">Ingreso</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Monto</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Moneda</FormLabel>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="BOB">BOB - Boliviano</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Descripción</FormLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Compra en supermercado"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fecha</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Notas (opcional)</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                width="full"
                isLoading={loading}
              >
                Crear Transacción
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
```

```bash
git add . && git commit -m "feat: create transaction form component"
git push -u origin feature/51-transaction-form
gh pr create --base develop --title "Create transaction form" --body "Closes #51"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/51-transaction-form
```

---

### Tarea 7.2: Crear tabla de transacciones con paginación

```bash
git checkout -b feature/52-transactions-table
```

Crear `components/transactions/TransactionsTable.tsx`:

```typescript
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
} from '@chakra-ui/react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useRef } from 'react'
import { deleteTransaction } from '@/lib/actions/transactions.actions'
import { formatCurrency } from '@/lib/utils/currency'
import type { TransactionWithCategory } from '@/types/database.types'

interface Props {
  transactions: TransactionWithCategory[]
  userId: string
  onUpdate: () => void
}

export function TransactionsTable({ transactions, userId, onUpdate }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()

  const handleDelete = async () => {
    if (!selectedId) return

    const result = await deleteTransaction(selectedId, userId)

    if (result.success) {
      toast({ title: 'Transacción eliminada', status: 'success' })
      onUpdate()
    } else {
      toast({ title: 'Error', description: result.error, status: 'error' })
    }
    onClose()
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
              <Td>{new Date(transaction.date).toLocaleDateString()}</Td>
              <Td>{transaction.description}</Td>
              <Td>{transaction.category.icon} {transaction.category.name}</Td>
              <Td>
                <Badge colorScheme={transaction.type === 'income' ? 'green' : 'red'}>
                  {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                </Badge>
              </Td>
              <Td isNumeric fontWeight="semibold">
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(Number(transaction.amount), transaction.currency)}
              </Td>
              <Td>
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Editar"
                    icon={<FiEdit2 />}
                    size="sm"
                    variant="ghost"
                  />
                  <IconButton
                    aria-label="Eliminar"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => {
                      setSelectedId(transaction.id)
                      onOpen()
                    }}
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
            <AlertDialogHeader>Eliminar Transacción</AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancelar</Button>
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
```

Falta importar useState al inicio.

```bash
git add . && git commit -m "feat: create transactions table with delete"
git push -u origin feature/52-transactions-table
gh pr create --base develop --title "Create transactions table" --body "Closes #52"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/52-transactions-table
```

---

### Tarea 7.3: Crear página de transacciones

```bash
git checkout -b feature/53-transactions-page
```

Crear `app/(dashboard)/transactions/page.tsx`:

```typescript
import { Box, Heading, Button, HStack } from '@chakra-ui/react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforge } from '@/lib/insforge'
import { TransactionsPageClient } from './TransactionsPageClient'
import { getCategories } from '@/lib/actions/categories.actions'

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user } = await insforge
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    redirect('/login')
  }

  const categoriesResult = await getCategories(user.id)
  const categories = categoriesResult.success ? categoriesResult.data : []

  return <TransactionsPageClient userId={user.id} categories={categories} />
}
```

Crear `app/(dashboard)/transactions/TransactionsPageClient.tsx`:

```typescript
'use client'

import {
  Box,
  Heading,
  Button,
  HStack,
  useDisclosure,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { Card } from '@/components/ui/Card'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { getTransactions } from '@/lib/actions/transactions.actions'

export function TransactionsPageClient({ userId, categories }: any) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    setLoading(true)
    const result = await getTransactions(userId, 100)
    if (result.success) {
      setTransactions(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [userId])

  return (
    <Box>
      <HStack justify="space-between" mb={8}>
        <Heading>Transacciones</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
          Nueva Transacción
        </Button>
      </HStack>

      <Card>
        {loading ? (
          <Center py={10}>
            <Spinner />
          </Center>
        ) : (
          <TransactionsTable
            transactions={transactions}
            userId={userId}
            onUpdate={fetchTransactions}
          />
        )}
      </Card>

      <TransactionForm
        isOpen={isOpen}
        onClose={onClose}
        userId={userId}
        categories={categories || []}
        onSuccess={fetchTransactions}
      />
    </Box>
  )
}
```

```bash
git add . && git commit -m "feat: create transactions page"
git push -u origin feature/53-transactions-page
gh pr create --base develop --title "Create transactions page" --body "Closes #53"
gh pr merge --squash && git checkout develop && git pull && git branch -d feature/53-transactions-page
```

---

### Tareas Restantes (resumidas):

**7.4:** Agregar filtros (por mes, categoría, tipo)
**7.5:** Implementar búsqueda de transacciones
**7.6:** Agregar paginación
**7.7:** Implementar edición de transacciones
**7.8:** Exportar a CSV/Excel (opcional)

---

## 🎯 Fin de Fase 7

```bash
gh pr create \
  --base main \
  --head develop \
  --title "FASE 07: Gestión de Transacciones" \
  --body "CRUD completo de transacciones con formularios, tabla y filtros

Closes #50"
```

**🛑 DETENER - 📢 NOTIFICAR - ⏸️ ESPERAR**

---

**Continuar con: FASE-08.md**
