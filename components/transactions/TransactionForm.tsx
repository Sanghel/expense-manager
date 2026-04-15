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
import type { Category } from '@/types/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: Category[]
  onSuccess: () => void
}

const defaultForm = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  currency: 'COP',
  category_id: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

export function TransactionForm({ isOpen, onClose, userId, categories, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const [formData, setFormData] = useState(defaultForm)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createTransaction(userId, {
      ...formData,
      amount: parseFloat(formData.amount),
    })

    if (result.success) {
      toast({ title: 'Transacción creada', status: 'success', duration: 3000 })
      onSuccess()
      onClose()
      setFormData(defaultForm)
    } else {
      toast({ title: 'Error', description: result.error, status: 'error', duration: 4000 })
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
                    setFormData({ ...formData, type: value, category_id: '' })
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
                  min="0.01"
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
