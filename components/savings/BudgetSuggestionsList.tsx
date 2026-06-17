'use client'

import { VStack, HStack, Box, Text, Button, useDisclosure } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  const handleApply = (suggestion: SavingsBudgetSuggestion) => {
    const existing = budgets.find((b) => b.category_id === suggestion.category_id)
    if (existing) {
      // Edit the existing budget, pre-loading the suggested amount.
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

  if (suggestions.length === 0) {
    return <Text color="#B0B0B0">No hay sugerencias de presupuesto para este periodo.</Text>
  }

  return (
    <>
      <VStack gap={3} align="stretch">
        {suggestions.map((s, i) => {
          const hasBudget = s.current_budget_amount != null
          return (
            <Box
              key={i}
              borderWidth="1px"
              borderRadius="lg"
              borderColor="#2d2d35"
              bg="#1a1a23"
              p={4}
            >
              <HStack justify="space-between" align="start" gap={4} flexWrap="wrap">
                <Box flex={1} minW="200px">
                  <Text fontWeight="semibold" color="white">
                    {s.category_name}
                  </Text>
                  <Text fontSize="sm" color="#B0B0B0" mt={1}>
                    {s.rationale}
                  </Text>
                  <HStack gap={4} mt={2} flexWrap="wrap">
                    <Text fontSize="sm" color="#4ade80" fontWeight="medium">
                      Sugerido: {formatCurrency(s.suggested_amount, currency)}
                    </Text>
                    {hasBudget && (
                      <Text fontSize="sm" color="#B0B0B0">
                        Actual: {formatCurrency(s.current_budget_amount as number, currency)}
                      </Text>
                    )}
                  </HStack>
                </Box>
                <Button
                  size="sm"
                  bg="#4F46E5"
                  color="white"
                  _hover={{ bg: '#4338CA' }}
                  flexShrink={0}
                  onClick={() => handleApply(s)}
                >
                  {hasBudget ? 'Ajustar y editar' : 'Aplicar y editar'}
                </Button>
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
        onSuccess={() => router.refresh()}
        editingBudget={editingBudget}
        prefill={prefill}
      />
    </>
  )
}
