'use client'

import { VStack, Heading, Button, HStack, Box, Icon, Text, Spinner } from '@chakra-ui/react'
import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FiPieChart } from 'react-icons/fi'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetGroupAccordion } from '@/components/budgets/BudgetGroupAccordion'
import { BudgetCategoryTable } from '@/components/budgets/BudgetCategoryTable'
import { BudgetProgress, progressColor } from '@/components/budgets/BudgetProgress'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteBudget } from '@/lib/actions/budgets.actions'
import { splitBudgetsByScope } from '@/lib/utils/budget-grouping'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import { toaster } from '@/lib/toaster'
import type { BudgetWithSpent, Category, CategoryGroupWithMembers } from '@/types/database.types'

type Vista = 'grupos' | 'categorias'

interface Props {
  userId: string
  categories: Category[]
  groups?: CategoryGroupWithMembers[]
  initialBudgets: BudgetWithSpent[]
  vista: Vista
}

export function BudgetsPageClient({
  userId,
  categories,
  groups = [],
  initialBudgets,
  vista,
}: Props) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()
  // Solo se lee junto a isPending: no hace falta limpiarlo al terminar la transición.
  const [pendingVista, setPendingVista] = useState<Vista | null>(null)

  const { total, groups: groupBudgets, categories: categoryBudgets } =
    splitBudgetsByScope(initialBudgets)

  const handleFormSuccess = useCallback(() => {
    router.refresh()
    setEditingBudget(null)
  }, [router])

  const handleEdit = (budget: BudgetWithSpent) => {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingBudget(null)
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    setIsDeleting(true)
    const result = await deleteBudget(pendingDeleteId, userId)
    setIsDeleting(false)
    if (result.success) {
      toaster.create({ title: 'Presupuesto eliminado', type: 'success', duration: 3000 })
      setPendingDeleteId(null)
      router.refresh()
    } else {
      toaster.create({ title: 'Error', description: result.error, type: 'error', duration: 3000 })
    }
  }

  const openCreateForm = useCallback(() => {
    setEditingBudget(null)
    setIsFormOpen(true)
  }, [])

  const switchVista = (next: Vista) => {
    if (next === vista) return
    setPendingVista(next)
    startTransition(() => {
      router.push(`/planificacion?tab=presupuestos&vista=${next}`, { scroll: false })
    })
  }

  const pill = (value: Vista, text: string) => {
    const isActive = vista === value
    return (
      <Button
        size="sm"
        borderRadius="full"
        onClick={() => switchVista(value)}
        bg={isActive ? '#4F46E5' : '#1A1A1A'}
        color={isActive ? 'white' : '#B0B0B0'}
        borderWidth="1px"
        borderColor={isActive ? '#4F46E5' : '#2d2d35'}
        _hover={{ bg: isActive ? '#4338CA' : '#22222a' }}
        aria-current={isActive ? 'page' : undefined}
      >
        {pendingVista === value && isPending && <Spinner size="xs" mr={2} />}
        {text}
      </Button>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between">
        <HStack gap={2}>
          <Icon as={FiPieChart} color="#6366f1" boxSize={6} />
          <Heading size="lg">Presupuestos</Heading>
        </HStack>
        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          onClick={openCreateForm}
        >
          Nuevo Presupuesto
        </Button>
      </HStack>

      {/* Presupuestos de scope 'total': no pertenecen a ningún sub-tab. */}
      {total.map((budget) => {
        const percentage = safeRatio(budget.spent, budget.limit_amount) * 100
        return (
          <Box key={budget.id} borderWidth="1px" borderColor="#2d2d35" borderRadius="lg" p={3} bg="#1A1A1A">
            <HStack justify="space-between" mb={2} gap={2}>
              <Text fontSize="sm" fontWeight="600" color="white" truncate minW={0}>
                🧾 Todos los gastos
              </Text>
              <HStack gap={2} flexShrink={0}>
                <Text fontSize="xs" color="#B0B0B0">
                  {formatCurrency(toNumber(budget.limit_amount), budget.currency)}
                </Text>
                <Text fontSize="sm" fontWeight="700" color={progressColor(percentage)}>
                  {percentage.toFixed(0)}%
                </Text>
                <Button size="xs" variant="outline" onClick={() => handleEdit(budget)}>
                  Editar
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => setPendingDeleteId(budget.id)}
                >
                  Eliminar
                </Button>
              </HStack>
            </HStack>
            <BudgetProgress budget={budget} variant="bar" />
          </Box>
        )
      })}

      <HStack gap={2}>
        {pill('grupos', 'Grupos')}
        {pill('categorias', 'Categorías')}
      </HStack>

      {vista === 'grupos' ? (
        <BudgetGroupAccordion
          groupBudgets={groupBudgets}
          categoryBudgets={categoryBudgets}
          groups={groups}
          onEdit={handleEdit}
          onDelete={setPendingDeleteId}
          onCreate={openCreateForm}
        />
      ) : (
        <BudgetCategoryTable
          budgets={categoryBudgets}
          onEdit={handleEdit}
          onDelete={setPendingDeleteId}
          onCreate={openCreateForm}
        />
      )}

      <BudgetForm
        isOpen={isFormOpen}
        onClose={handleClose}
        userId={userId}
        categories={categories}
        groups={groups}
        onSuccess={handleFormSuccess}
        editingBudget={editingBudget}
        defaultScope={vista === 'grupos' ? 'group' : 'category'}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Presupuesto"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />
    </VStack>
  )
}
