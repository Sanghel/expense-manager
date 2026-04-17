'use client'

import { Box, VStack, HStack, Text, Input } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateRate } from '@/lib/actions/exchangeRates.actions'
import { toaster } from '@/lib/toaster'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { ExchangeRate, Currency } from '@/types/database.types'

const PAIRS: Array<{ id: string; from: Currency; to: Currency; label: string }> = [
  { id: 'USD_COP', from: 'USD', to: 'COP', label: '1 USD → COP' },
  { id: 'VES_COP', from: 'VES', to: 'COP', label: '1 Bs (VES) → COP' },
  { id: 'USD_VES', from: 'USD', to: 'VES', label: '1 USD → Bs (VES)' },
]

interface RateRow {
  id: string
  label: string
  rate: string
  date: string
}

interface Props {
  initialRates: ExchangeRate[]
}

function getRateValue(rates: ExchangeRate[], from: Currency, to: Currency): number {
  const r = rates.find((x) => x.from_currency === from && x.to_currency === to)
  return r ? r.rate : 0
}

const rateColumns: ColumnDef<RateRow>[] = [
  { key: 'label', header: 'Par', render: (r) => <Text fontWeight="medium">{r.label}</Text> },
  { key: 'rate', header: 'Tasa actual', render: (r) => r.rate },
  { key: 'date', header: 'Fecha', render: (r) => <Text color="#B0B0B0" fontSize="xs">{r.date}</Text> },
]

export function ExchangeRatesForm({ initialRates }: Props) {
  const router = useRouter()
  const [rates, setRates] = useState<ExchangeRate[]>(initialRates)
  const [inputs, setInputs] = useState({
    USD_COP: String(getRateValue(initialRates, 'USD', 'COP')),
    VES_COP: String(getRateValue(initialRates, 'VES', 'COP')),
    USD_VES: String(getRateValue(initialRates, 'USD', 'VES')),
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRates(initialRates)
  }, [initialRates])

  const handleSave = async () => {
    setLoading(true)

    const usdCop = parseFloat(inputs.USD_COP)
    const vesCop = parseFloat(inputs.VES_COP)
    const usdVes = parseFloat(inputs.USD_VES)

    if (isNaN(usdCop) || isNaN(vesCop) || isNaN(usdVes) || usdCop <= 0 || vesCop <= 0 || usdVes <= 0) {
      toaster.create({ title: 'Valores inválidos', description: 'Todos los valores deben ser números positivos', type: 'error', duration: 4000 })
      setLoading(false)
      return
    }

    const updates = [
      updateRate('USD', 'COP', usdCop),
      updateRate('COP', 'USD', 1 / usdCop),
      updateRate('VES', 'COP', vesCop),
      updateRate('COP', 'VES', 1 / vesCop),
      updateRate('USD', 'VES', usdVes),
      updateRate('VES', 'USD', 1 / usdVes),
    ]

    const results = await Promise.all(updates)
    const failed = results.filter((r) => !r.success)

    if (failed.length === 0) {
      toaster.create({ title: 'Tasas actualizadas', type: 'success', duration: 3000 })
      router.refresh()
    } else {
      toaster.create({ title: 'Error al actualizar', description: 'Algunas tasas no se guardaron', type: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  const rateRows: RateRow[] = PAIRS.map(({ id, from, to, label }) => {
    const r = rates.find((x) => x.from_currency === from && x.to_currency === to)
    return {
      id,
      label,
      rate: r ? r.rate.toLocaleString('es-CO') : '—',
      date: r?.date ?? '—',
    }
  })

  return (
    <VStack gap={6} align="stretch">
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        <DataTable data={rateRows} columns={rateColumns} size="sm" />
      </Box>

      <VStack gap={4} align="stretch">
        <Text fontWeight="semibold" fontSize="sm" color="white">Actualizar tasas</Text>

        {PAIRS.map(({ id, label }) => {
          const key = id as keyof typeof inputs
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

        <PrimaryButton onClick={handleSave} loading={loading}>
          Guardar Tasas
        </PrimaryButton>
      </VStack>
    </VStack>
  )
}
