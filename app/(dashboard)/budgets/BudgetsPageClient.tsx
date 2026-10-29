'use client'

import { Button, Flex, Text, VStack } from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUrlParams } from '@/hooks/useUrlParams'
import { LuPlus } from 'react-icons/lu'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { BudgetGroupTiles } from '@/components/budgets/BudgetGroupTiles'
import { BudgetCategoryCards } from '@/components/budgets/BudgetCategoryCards'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { deleteBudget } from '@/lib/actions/budgets.actions'
import { splitBudgetsByScope } from '@/lib/utils/budget-grouping'
import { formatCompactCurrency } from '@/lib/utils/currency'
import { safeRatio, toNumber } from '@/lib/utils/numbers'
import { toaster } from '@/lib/toaster'
import type { BudgetWithSpent, Category, CategoryGroupWithMembers } from '@/types/database.types'

type Vista = 'grupos' | 'categorias'

interface Props {
  userId: string
  categories: Category[]
  groups?: CategoryGroupWithMembers[]
  initialBudgets: BudgetWithSpent[]
}

export function BudgetsPageClient({
  userId,
  categories,
  groups = [],
  initialBudgets,
}: Props) {
  const router = useRouter()
  const { searchParams, setParams } = useUrlParams()
  const vista: Vista = searchParams.get('vista') === 'categorias' ? 'categorias' : 'grupos'
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    // Client-side only: both views render from the same data.
    if (next !== vista) setParams({ tab: 'presupuestos', vista: next })
  }

  // Header total: the "total" budget when there is one, else the group budgets
  // that share the first one's currency.
  const summarySource = total.length > 0 ? total : groupBudgets
  const summaryCurrency = summarySource[0]?.currency
  const sameCurrency = summarySource.filter((b) => b.currency === summaryCurrency)
  const summarySpent = sameCurrency.reduce((s, b) => s + toNumber(b.spent), 0)
  const summaryLimit = sameCurrency.reduce((s, b) => s + toNumber(b.limit_amount), 0)
  const summaryPercent = safeRatio(summarySpent, summaryLimit) * 100

  return (
    <VStack gap={5} align="stretch">
      <Flex align="center" gap={3} wrap="wrap">
        <Flex gap={1.5} role="tablist" aria-label="Vista">
          {(
            [
              ['grupos', 'Grupos'],
              ['categorias', 'Categorías'],
            ] as const
          ).map(([value, text]) => {
            const active = vista === value
            return (
              <Button
                key={value}
                role="tab"
                aria-selected={active}
                onClick={() => switchVista(value)}
                size="sm"
                h="34px"
                px={3.5}
                bg={active ? 'text' : 'transparent'}
                color={active ? 'bg' : 'text2'}
                boxShadow={active ? 'none' : 'inset 0 0 0 1px var(--chakra-colors-line)'}
                _hover={active ? undefined : { bg: 'surface2', color: 'text' }}
              >
                {text}
              </Button>
            )
          })}
        </Flex>

        {summaryCurrency && summaryLimit > 0 && (
          <Flex align="center" gap={1.5} fontFamily="mono" fontSize="13px" color="text2">
            <Text color="text">{formatCompactCurrency(summarySpent, summaryCurrency)}</Text>
            <Text>/ {formatCompactCurrency(summaryLimit, summaryCurrency)}</Text>
            <Text color={summaryPercent >= 100 ? 'neg' : summaryPercent >= 80 ? 'warn' : 'text3'}>
              · {Math.round(summaryPercent)}%
            </Text>
            {total[0] && (
              <Flex ms={1} gap={0.5}>
                <ActionIconButton kind="edit" label="Editar presupuesto total" size="xs" variant="ghost" onClick={() => handleEdit(total[0])} />
                <ActionIconButton kind="delete" tone="danger" label="Eliminar presupuesto total" size="xs" variant="ghost" onClick={() => setPendingDeleteId(total[0].id)} />
              </Flex>
            )}
          </Flex>
        )}

        <Button ms="auto" size="sm" bg="brandSolid" color="white" _hover={{ bg: 'brand.600' }} onClick={openCreateForm}>
          <LuPlus />
          Nuevo
        </Button>
      </Flex>

      {vista === 'grupos' ? (
        <BudgetGroupTiles
          groupBudgets={groupBudgets}
          categoryBudgets={categoryBudgets}
          groups={groups}
          onCreate={openCreateForm}
          onShowCategories={() => switchVista('categorias')}
        />
      ) : (
        <BudgetCategoryCards
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
        onSuccess={handleFormSuccess}
        editingBudget={editingBudget}
        defaultScope="category"
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar presupuesto"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />
    </VStack>
  )
}
