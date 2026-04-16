'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Table,
} from '@chakra-ui/react'
import { useState } from 'react'
import { updateRate, getAllRatePairs } from '@/lib/actions/exchangeRates.actions'
import { toaster } from '@/lib/toaster'
import type { ExchangeRate, Currency } from '@/types/database.types'

const PAIRS: Array<{ from: Currency; to: Currency; label: string }> = [
  { from: 'USD', to: 'COP', label: '1 USD → COP' },
  { from: 'VES', to: 'COP', label: '1 Bs (VES) → COP' },
  { from: 'USD', to: 'VES', label: '1 USD → Bs (VES)' },
]

interface Props {
  initialRates: ExchangeRate[]
}

function getRateValue(rates: ExchangeRate[], from: Currency, to: Currency): number {
  const r = rates.find((x) => x.from_currency === from && x.to_currency === to)
  return r ? r.rate : 0
}

export function ExchangeRatesForm({ initialRates }: Props) {
  const [rates, setRates] = useState<ExchangeRate[]>(initialRates)
  const [inputs, setInputs] = useState({
    USD_COP: String(getRateValue(initialRates, 'USD', 'COP')),
    VES_COP: String(getRateValue(initialRates, 'VES', 'COP')),
    USD_VES: String(getRateValue(initialRates, 'USD', 'VES')),
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)

    const usdCop = parseFloat(inputs.USD_COP)
    const bobCop = parseFloat(inputs.VES_COP)
    const usdBob = parseFloat(inputs.USD_VES)

    if (isNaN(usdCop) || isNaN(bobCop) || isNaN(usdBob) || usdCop <= 0 || bobCop <= 0 || usdBob <= 0) {
      toaster.create({ title: 'Valores inválidos', description: 'Todos los valores deben ser números positivos', type: 'error', duration: 4000 })
      setLoading(false)
      return
    }

    const updates = [
      updateRate('USD', 'COP', usdCop),
      updateRate('COP', 'USD', 1 / usdCop),
      updateRate('VES', 'COP', bobCop),
      updateRate('COP', 'VES', 1 / bobCop),
      updateRate('USD', 'VES', usdBob),
      updateRate('VES', 'USD', 1 / usdBob),
    ]

    const results = await Promise.all(updates)
    const failed = results.filter((r) => !r.success)

    if (failed.length === 0) {
      toaster.create({ title: 'Tasas actualizadas', type: 'success', duration: 3000 })
      // Refresh displayed rates
      const refreshed = await getAllRatePairs()
      if (refreshed.success && refreshed.data) {
        setRates(refreshed.data as ExchangeRate[])
      }
    } else {
      toaster.create({ title: 'Error al actualizar', description: 'Algunas tasas no se guardaron', type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Tabla de tasas actuales */}
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Par</Table.ColumnHeader>
              <Table.ColumnHeader>Tasa actual</Table.ColumnHeader>
              <Table.ColumnHeader>Fecha</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {PAIRS.map(({ from, to, label }) => {
              const r = rates.find((x) => x.from_currency === from && x.to_currency === to)
              return (
                <Table.Row key={`${from}_${to}`}>
                  <Table.Cell fontWeight="medium">{label}</Table.Cell>
                  <Table.Cell>{r ? r.rate.toLocaleString('es-CO') : '—'}</Table.Cell>
                  <Table.Cell color="#B0B0B0" fontSize="xs">{r?.date ?? '—'}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Formulario de actualización */}
      <VStack gap={4} align="stretch">
        <Text fontWeight="semibold" fontSize="sm" color="white">Actualizar tasas</Text>

        {PAIRS.map(({ from, to, label }) => {
          const key = `${from}_${to}` as keyof typeof inputs
          return (
            <HStack key={key} gap={4}>
              <Text fontSize="sm" color="#B0B0B0" minW="28">{label}</Text>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={inputs[key]}
                onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                w="40"
                size="sm"
              />
            </HStack>
          )
        })}

        <Button
          bg="#4F46E5"
          color="white"
          _hover={{ bg: '#4338CA' }}
          alignSelf="flex-start"
          loading={loading}
          onClick={handleSave}
        >
          Guardar Tasas
        </Button>
      </VStack>
    </VStack>
  )
}
