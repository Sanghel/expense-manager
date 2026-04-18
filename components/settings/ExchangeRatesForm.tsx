'use client'

import { Box, Text } from '@chakra-ui/react'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import type { ExchangeRate, Currency } from '@/types/database.types'

const DISPLAY_PAIRS: Array<{ from: Currency; to: Currency; label: string }> = [
  { from: 'USD', to: 'COP', label: '1 USD → COP' },
  { from: 'COP', to: 'USD', label: '1 COP → USD' },
  { from: 'USD', to: 'VES', label: '1 USD → Bs (VES)' },
  { from: 'VES', to: 'USD', label: '1 Bs (VES) → USD' },
  { from: 'VES', to: 'COP', label: '1 Bs (VES) → COP' },
  { from: 'COP', to: 'VES', label: '1 COP → Bs (VES)' },
]

interface RateRow {
  id: string
  label: string
  rate: string
  date: string
}

const columns: ColumnDef<RateRow>[] = [
  { key: 'label', header: 'Par', render: (r) => <Text fontWeight="medium">{r.label}</Text> },
  { key: 'rate', header: 'Tasa', render: (r) => r.rate },
  { key: 'date', header: 'Última actualización', render: (r) => <Text color="#B0B0B0" fontSize="xs">{r.date}</Text> },
]

interface Props {
  initialRates: ExchangeRate[]
}

export function ExchangeRatesForm({ initialRates }: Props) {
  const rows: RateRow[] = DISPLAY_PAIRS.map(({ from, to, label }) => {
    const r = initialRates.find((x) => x.from_currency === from && x.to_currency === to)
    return {
      id: `${from}_${to}`,
      label,
      rate: r ? r.rate.toLocaleString('es-CO', { maximumFractionDigits: 6 }) : '—',
      date: r?.date ?? '—',
    }
  })

  return (
    <Box>
      <Text fontSize="xs" color="#B0B0B0" mb={3}>
        Tasas actualizadas automáticamente cada día a las 12 PM (hora Colombia)
      </Text>
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        <DataTable data={rows} columns={columns} size="sm" />
      </Box>
    </Box>
  )
}
