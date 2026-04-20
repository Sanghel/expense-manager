'use client'

import { useState } from 'react'
import { Box, Button, Text, VStack, HStack, Badge } from '@chakra-ui/react'
import { updateExchangeRates } from '@/lib/actions/exchangeRates.actions'
import { generateRecurringTransactions } from '@/lib/actions/recurring.actions'

interface Props {
  userId: string
}

type ActionStatus = 'idle' | 'loading' | 'success' | 'error'

interface ActionState {
  status: ActionStatus
  message: string
}

export function CronActionsPanel({ userId }: Props) {
  const [ratesState, setRatesState] = useState<ActionState>({ status: 'idle', message: '' })
  const [recurringState, setRecurringState] = useState<ActionState>({ status: 'idle', message: '' })

  async function handleUpdateRates() {
    setRatesState({ status: 'loading', message: '' })
    const result = await updateExchangeRates()
    if (result.success && result.data) {
      const d = result.data as { usdCop: number; usdVes: number; date: string }
      setRatesState({
        status: 'success',
        message: `Tasas actualizadas (${d.date}): USD→COP ${d.usdCop.toFixed(2)}, USD→VES ${d.usdVes.toFixed(2)}`,
      })
    } else {
      setRatesState({ status: 'error', message: result.error ?? 'Error desconocido' })
    }
  }

  async function handleGenerateRecurring() {
    setRecurringState({ status: 'loading', message: '' })
    const result = await generateRecurringTransactions(userId)
    if (result.success && result.data) {
      setRecurringState({
        status: 'success',
        message: `${result.data.generated} transacción(es) generada(s)`,
      })
    } else {
      setRecurringState({ status: 'error', message: result.error ?? 'Error desconocido' })
    }
  }

  return (
    <VStack gap={4} align="stretch">
      <ActionRow
        label="Tasas de cambio"
        description="Obtiene las tasas actuales desde exchangerate-api y las guarda en la base de datos."
        buttonLabel="Actualizar ahora"
        state={ratesState}
        onAction={handleUpdateRates}
      />
      <ActionRow
        label="Transacciones recurrentes"
        description="Genera las transacciones recurrentes pendientes para hoy."
        buttonLabel="Generar ahora"
        state={recurringState}
        onAction={handleGenerateRecurring}
      />
    </VStack>
  )
}

interface ActionRowProps {
  label: string
  description: string
  buttonLabel: string
  state: ActionState
  onAction: () => void
}

function ActionRow({ label, description, buttonLabel, state, onAction }: ActionRowProps) {
  return (
    <Box
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor="#2d2d35"
      bg="#1a1a22"
    >
      <HStack justify="space-between" align="flex-start" gap={4}>
        <Box flex={1}>
          <Text fontWeight="semibold" color="white" mb={1}>
            {label}
          </Text>
          <Text fontSize="sm" color="#B0B0B0">
            {description}
          </Text>
          {state.status !== 'idle' && (
            <HStack mt={2} gap={2} align="center">
              {state.status === 'success' && (
                <Badge colorPalette="green" size="sm">{state.message}</Badge>
              )}
              {state.status === 'error' && (
                <Badge colorPalette="red" size="sm">{state.message}</Badge>
              )}
            </HStack>
          )}
        </Box>
        <Button
          size="sm"
          variant="outline"
          colorPalette="brand"
          loading={state.status === 'loading'}
          loadingText="Ejecutando..."
          onClick={onAction}
          flexShrink={0}
        >
          {buttonLabel}
        </Button>
      </HStack>
    </Box>
  )
}
