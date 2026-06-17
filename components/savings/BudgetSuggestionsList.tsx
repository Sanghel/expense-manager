'use client'

import { VStack, HStack, Box, Text, Button, Icon, useDisclosure } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiCheck } from 'react-icons/fi'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { formatCurrency } from '@/lib/utils/currency'
import type { Category, Currency, SavingsBudgetSuggestion } from '@/types/database.types'

export interface ExistingBudget {
  id: string
  category_id: string
  amount: number
  currency: Currency
  period: 'monthly' | 'yearly'
  start_date: string
}

interface Props {
  userId: string
  suggestions: SavingsBudgetSuggestion[]
  budgets: ExistingBudget[]
  categories: Category[]
  currency: Currency
}

export function BudgetSuggestionsList({ userId, suggestions, budgets, categories, currency }: Props) {
  const router = useRouter()
  const { open, onOpen, onClose } = useDisclosure()
  const [editingBudget, setEditingBudget] = useState<ExistingBudget | null>(null)
  const [prefill, setPrefill] = useState<{ category_id: string; amount: number; currency: Currency } | null>(null)
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)
  // Categories marked applied during this session (instant feedback before refresh).
  const [sessionApplied, setSessionApplied] = useState<Set<string>>(new Set())

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  // A category counts as "applied" once it has a live budget.
  const budgetedCategoryIds = useMemo(() => new Set(budgets.map((b) => b.category_id)), [budgets])

  const isApplied = (categoryId: string) =>
    budgetedCategoryIds.has(categoryId) || sessionApplied.has(categoryId)

  const handleApply = (suggestion: SavingsBudgetSuggestion) => {
    const existing = budgets.find((b) => b.category_id === suggestion.category_id)
    setPendingCategoryId(suggestion.category_id)
    if (existing) {
      setEditingBudget({ ...existing, amount: suggestion.suggested_amount })
      setPrefill(null)
    } else {
      setEditingBudget(null)
      setPrefill({
        category_id: suggestion.category_id,
        amount: suggestion.suggested_amount,
        currency,
      })
    }
    onOpen()
  }

  const handleSuccess = () => {
    if (pendingCategoryId) {
      setSessionApplied((prev) => new Set(prev).add(pendingCategoryId))
    }
    router.refresh()
  }

  if (suggestions.length === 0) {
    return <Text color="#B0B0B0">No hay sugerencias de presupuesto para este periodo.</Text>
  }

  return (
    <>
      <VStack gap={3} align="stretch">
        {suggestions.map((s, i) => {
          const category = categoryMap.get(s.category_id)
          const accent = category?.color ?? '#2d2d35'
          const applied = isApplied(s.category_id)
          return (
            <Box
              key={i}
              borderWidth="1px"
              borderLeftWidth="4px"
              borderRadius="lg"
              borderColor="#2d2d35"
              borderLeftColor={accent}
              bg="#1a1a23"
              p={4}
            >
              <HStack justify="space-between" align="start" gap={4} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <HStack gap={2}>
                    {category?.icon && <Text fontSize="lg">{category.icon}</Text>}
                    <Text fontWeight="semibold" color="white">
                      {s.category_name}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="#B0B0B0" mt={1}>
                    {s.rationale}
                  </Text>
                  <HStack gap={4} mt={2} flexWrap="wrap">
                    <Text fontSize="sm" color="#4ade80" fontWeight="medium">
                      Sugerido: {formatCurrency(s.suggested_amount, currency)}
                    </Text>
                    {s.current_budget_amount != null && (
                      <Text fontSize="sm" color="#B0B0B0">
                        Actual: {formatCurrency(s.current_budget_amount, currency)}
                      </Text>
                    )}
                  </HStack>
                </Box>

                {applied ? (
                  <Button size="sm" variant="outline" colorPalette="green" disabled flexShrink={0}>
                    <Icon as={FiCheck} />
                    Aplicado
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    bg="#4F46E5"
                    color="white"
                    _hover={{ bg: '#4338CA' }}
                    flexShrink={0}
                    onClick={() => handleApply(s)}
                  >
                    Aplicar y editar
                  </Button>
                )}
              </HStack>
            </Box>
          )
        })}
      </VStack>

      <BudgetForm
        isOpen={open}
        onClose={onClose}
        userId={userId}
        categories={categories}
        onSuccess={handleSuccess}
        editingBudget={editingBudget}
        prefill={prefill}
      />
    </>
  )
}
