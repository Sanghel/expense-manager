'use client'

import { VStack, HStack, Box, Text, Button, Icon, useDisclosure } from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiTarget, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency, SavingsGoal, SavingsGoalSuggestion } from '@/types/database.types'

interface Capacity {
  avgMonthlyIncome: number
  avgMonthlyExpense: number
  monthlySavingsCapacity: number
  monthsAnalyzed: number
}

interface Props {
  userId: string
  suggestions: SavingsGoalSuggestion[]
  capacity: Capacity
  currency: Currency
}

export function SavingsGoalSuggestions({ userId, suggestions, capacity, currency }: Props) {
  const router = useRouter()
  const { open, onOpen, onClose } = useDisclosure()
  const [prefill, setPrefill] = useState<SavingsGoal | null>(null)

  const positive = capacity.monthlySavingsCapacity > 0

  const handleCreate = (s: SavingsGoalSuggestion) => {
    setPrefill({
      id: '',
      user_id: userId,
      name: s.name,
      target_amount: s.target_amount,
      current_amount: 0,
      currency,
      deadline: s.deadline ?? null,
      is_completed: false,
      created_at: '',
    })
    onOpen()
  }

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* Capacidad de ahorro */}
        <Card borderLeftWidth="4px" borderLeftColor={positive ? '#4ade80' : '#dc2626'}>
          <HStack gap={3} align="start">
            <Icon as={positive ? FiTrendingUp : FiTrendingDown} color={positive ? '#4ade80' : '#dc2626'} boxSize={6} mt={1} />
            <Box>
              <Text fontSize="sm" color="#B0B0B0">
                Capacidad de ahorro mensual estimada
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color={positive ? '#4ade80' : '#dc2626'}>
                {formatCurrency(capacity.monthlySavingsCapacity, currency)}
              </Text>
              <Text fontSize="xs" color="#B0B0B0" mt={1}>
                Ingreso prom. {formatCurrency(capacity.avgMonthlyIncome, currency)} − Gasto prom.{' '}
                {formatCurrency(capacity.avgMonthlyExpense, currency)} · {capacity.monthsAnalyzed}{' '}
                {capacity.monthsAnalyzed === 1 ? 'mes analizado' : 'meses analizados'}
              </Text>
            </Box>
          </HStack>
        </Card>

        {/* Metas sugeridas */}
        {suggestions.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No hay metas sugeridas para este periodo.
          </Text>
        ) : (
          suggestions.map((s, i) => (
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
                  <HStack gap={2}>
                    <Icon as={FiTarget} color="#6366f1" />
                    <Text fontWeight="semibold" color="white">
                      {s.name}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="#B0B0B0" mt={1}>
                    {s.rationale}
                  </Text>
                  <HStack gap={4} mt={2} flexWrap="wrap">
                    <Text fontSize="sm" color="#4ade80" fontWeight="medium">
                      Objetivo: {formatCurrency(s.target_amount, currency)}
                    </Text>
                    {s.monthly_contribution != null && (
                      <Text fontSize="sm" color="#B0B0B0">
                        Aporte: {formatCurrency(s.monthly_contribution, currency)}/mes
                      </Text>
                    )}
                    {s.deadline && (
                      <Text fontSize="sm" color="#B0B0B0">
                        Para: {s.deadline}
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
                  onClick={() => handleCreate(s)}
                >
                  Crear meta
                </Button>
              </HStack>
            </Box>
          ))
        )}
      </VStack>

      <SavingsGoalForm
        isOpen={open}
        onClose={onClose}
        userId={userId}
        onSuccess={() => router.refresh()}
        initialData={prefill ?? undefined}
      />
    </>
  )
}
