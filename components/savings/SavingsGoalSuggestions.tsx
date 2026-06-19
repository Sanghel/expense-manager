'use client'

import { VStack, HStack, Box, Text, Button, Icon, IconButton, useDisclosure } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiTarget, FiTrendingUp, FiTrendingDown, FiX } from 'react-icons/fi'
import { SavingsGoalForm } from '@/components/savings/SavingsGoalForm'
import { Card } from '@/components/ui/Card'
import { dismissSuggestion } from '@/lib/actions/savingsAdvice.actions'
import { toaster } from '@/lib/toaster'
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
  period: string
  suggestions: SavingsGoalSuggestion[]
  goals: SavingsGoal[]
  capacity: Capacity
  currency: Currency
}

// Treats amounts as equal within a small relative tolerance, so rounding in
// the AI-suggested figure doesn't flag an otherwise-identical goal as "differs".
function amountsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(1, Math.round(Math.max(a, b) * 0.005))
}

const normalizeName = (name: string) => name.trim().toLowerCase()

export function SavingsGoalSuggestions({ userId, period, suggestions, goals, capacity, currency }: Props) {
  const router = useRouter()
  const { open, onOpen, onClose } = useDisclosure()
  const [prefill, setPrefill] = useState<SavingsGoal | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | undefined>(undefined)
  // Goal names dismissed during this session (hidden instantly; persisted on the server).
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const positive = capacity.monthlySavingsCapacity > 0

  // Existing goal per normalized name, used to dedup suggestions against what exists.
  const goalByName = useMemo(
    () => new Map(goals.map((g) => [normalizeName(g.name), g])),
    [goals]
  )

  const handleCreate = (s: SavingsGoalSuggestion) => {
    const existing = goalByName.get(normalizeName(s.name))
    if (existing) {
      // Edit the existing goal, pre-filled with the suggested target.
      setEditingGoalId(existing.id)
      setPrefill({ ...existing, target_amount: s.target_amount })
    } else {
      setEditingGoalId(undefined)
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
    }
    onOpen()
  }

  const handleDismiss = async (name: string) => {
    // Optimistic: hide it right away, restore if the server rejects.
    setDismissed((prev) => new Set(prev).add(name))
    const result = await dismissSuggestion(userId, period, 'goal', name)
    if (!result.success) {
      setDismissed((prev) => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
      toaster.create({ title: result.error ?? 'Error', type: 'error', duration: 4000 })
      return
    }
    router.refresh()
  }

  // Show a suggestion only if it adds an action: it's new, or it differs from
  // the existing goal (so the user can edit it). A suggestion matching an
  // existing goal with the same target is redundant and gets hidden.
  const visibleSuggestions = suggestions.filter((s) => {
    if (dismissed.has(s.name)) return false
    const existing = goalByName.get(normalizeName(s.name))
    if (!existing) return true
    // Different currency → can't safely compare, surface it for editing.
    if (existing.currency !== currency) return true
    return !amountsEqual(existing.target_amount, s.target_amount)
  })

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
        {visibleSuggestions.length === 0 ? (
          <Text color="#B0B0B0" fontSize="sm">
            No hay metas sugeridas para este periodo.
          </Text>
        ) : (
          visibleSuggestions.map((s, i) => {
          const exists = goalByName.has(normalizeName(s.name))
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
                <HStack gap={1} flexShrink={0}>
                  <Button
                    size="sm"
                    bg="#4F46E5"
                    color="white"
                    _hover={{ bg: '#4338CA' }}
                    onClick={() => handleCreate(s)}
                  >
                    {exists ? 'Editar meta' : 'Crear meta'}
                  </Button>
                  <IconButton
                    aria-label="Descartar sugerencia"
                    size="sm"
                    variant="ghost"
                    color="#B0B0B0"
                    _hover={{ color: '#ef4444', bg: '#2d2d35' }}
                    onClick={() => handleDismiss(s.name)}
                  >
                    <FiX />
                  </IconButton>
                </HStack>
              </HStack>
            </Box>
          )
          })
        )}
      </VStack>

      <SavingsGoalForm
        isOpen={open}
        onClose={onClose}
        userId={userId}
        onSuccess={() => router.refresh()}
        initialData={prefill ?? undefined}
        goalId={editingGoalId}
      />
    </>
  )
}
