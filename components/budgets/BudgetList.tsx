'use client'

import { VStack, HStack, Box, Text, Button, Heading, useDisclosure, DialogRoot, DialogBackdrop, DialogPositioner, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBudget } from '@/lib/actions/budgets.actions'
import { toaster } from '@/lib/toaster'
import { BudgetProgress } from './BudgetProgress'
import type { Budget } from '@/types/database.types'

interface BudgetWithSpent extends Budget {
  spent: number
  category: { name: string; type: string }
}

interface Props {
  userId: string
  initialBudgets: BudgetWithSpent[]
  onEdit?: (budget: BudgetWithSpent) => void
}

export function BudgetList({ userId, initialBudgets, onEdit }: Props) {
  const router = useRouter()
  const [budgets] = useState<BudgetWithSpent[]>(initialBudgets)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { open, onOpen, onClose } = useDisclosure()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (budgetId: string) => {
    setSelectedId(budgetId)
    onOpen()
  }

  const handleDelete = async () => {
    if (!selectedId) return

    setIsDeleting(true)
    const result = await deleteBudget(selectedId, userId)
    setIsDeleting(false)

    if (result.success) {
      toaster.create({ title: 'Presupuesto eliminado', type: 'success', duration: 3000 })
      onClose()
      router.refresh()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 3000 })
    }
  }

  if (budgets.length === 0) {
    return <Text color="#B0B0B0">No hay presupuestos creados. Crea uno para empezar.</Text>
  }

  return (
    <>
      <VStack gap={4} align="stretch">
        {budgets.map((budget) => (
          <Box
            key={budget.id}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="#1A1A1A"
            _hover={{ borderColor: '#4F46E5' }}
            transition="all 0.2s"
          >
            <VStack gap={3} align="stretch">
              <HStack justify="space-between">
                <div>
                  <Heading size="sm">{budget.category?.name || 'Unknown'}</Heading>
                  <Text fontSize="xs" color="#B0B0B0" mt={1}>
                    {budget.period === 'monthly' ? 'Mensual' : 'Anual'} • {budget.start_date}
                  </Text>
                </div>
                <Text fontSize="lg" fontWeight="bold">
                  {budget.amount.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {budget.currency}
                </Text>
              </HStack>

              <BudgetProgress budget={budget} />

              <HStack gap={2} pt={2}>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(budget)}
                  >
                    Editar
                  </Button>
                )}
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => handleDeleteClick(budget.id)}
                >
                  Eliminar
                </Button>
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>

      <DialogRoot
        open={open}
        onOpenChange={({ open: isOpen }) => !isOpen && onClose()}
        placement="center"
        lazyMount
        unmountOnExit
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent tabIndex={-1}>
          <DialogHeader>
            <DialogTitle>Eliminar Presupuesto</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            ¿Estás seguro? Esta acción no se puede deshacer.
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={handleDelete} loading={isDeleting} ml={3}>
              Eliminar
            </Button>
          </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  )
}
