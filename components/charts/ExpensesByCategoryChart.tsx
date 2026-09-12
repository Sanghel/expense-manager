'use client'

import { ResponsiveBar } from '@nivo/bar'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { nivoTheme, EXPENSE, INCOME } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import type { NamedAmount } from '@/lib/actions/reports.actions'
import type { Currency } from '@/types/database.types'

interface Props {
  type: 'income' | 'expense'
  data: NamedAmount[]
  currency: Currency
}

const MAX_ROWS = 12

export function ExpensesByCategoryChart({ type, data, currency }: Props) {
  const isIncome = type === 'income'
  const rows = data.slice(0, MAX_ROWS)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  // Colour follows the entity, not its rank: each bar takes the category's own
  // colour, falling back to the semantic income/expense hue.
  const chartData = [...rows].reverse().map((d) => ({
    id: d.id,
    label: `${d.icon ?? '🏷️'} ${d.label}`,
    value: Math.round(d.value),
    color: d.color ?? (isIncome ? INCOME : EXPENSE),
  }))

  return (
    <ChartCard
      title={isIncome ? 'Ingresos por Categoría' : 'Gastos por Categoría'}
      subtitle={data.length > MAX_ROWS ? `Top ${MAX_ROWS} de ${data.length}` : undefined}
      height={Math.max(220, chartData.length * 32 + 50)}
      isEmpty={chartData.length === 0}
    >
      <ResponsiveBar
        data={chartData}
        keys={['value']}
        indexBy="label"
        layout="horizontal"
        theme={nivoTheme}
        colors={(bar) => (bar.data as { color: string }).color}
        margin={{ top: 4, right: 16, bottom: 32, left: 132 }}
        padding={0.35}
        borderRadius={4}
        enableGridY={false}
        enableGridX
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 4,
          format: (v) => formatCurrency(Number(v), currency).replace(/[,.]\d{2}$/, ''),
        }}
        labelSkipWidth={64}
        label={(d) => `${(safeRatio(Number(d.value), total) * 100).toFixed(0)}%`}
        tooltip={({ data: d, value, color }) => (
          <ChartTooltip
            title={d.label}
            rows={[
              { color, label: 'Monto', value: formatCurrency(Number(value), currency) },
              {
                muted: true,
                label: 'Del total',
                value: `${(safeRatio(Number(value), total) * 100).toFixed(1)}%`,
              },
            ]}
          />
        )}
        role="img"
        ariaLabel={isIncome ? 'Ingresos por categoría' : 'Gastos por categoría'}
      />
    </ChartCard>
  )
}
