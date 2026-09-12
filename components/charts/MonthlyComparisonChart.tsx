'use client'

import { ResponsiveBar } from '@nivo/bar'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { nivoTheme, EXPENSE, INCOME } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

interface Props {
  data: { month: string; income: number; expense: number }[]
  currency: Currency
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  })
}

export function MonthlyComparisonChart({ data, currency }: Props) {
  const chartData = data.map((d) => ({
    month: monthLabel(d.month),
    Ingresos: Math.round(d.income),
    Gastos: Math.round(d.expense),
  }))

  return (
    <ChartCard title="Ingresos vs. Gastos" height={300} isEmpty={chartData.length === 0}>
      <ResponsiveBar
        data={chartData}
        keys={['Ingresos', 'Gastos']}
        indexBy="month"
        groupMode="grouped"
        theme={nivoTheme}
        colors={({ id }) => (id === 'Ingresos' ? INCOME : EXPENSE)}
        margin={{ top: 16, right: 16, bottom: 56, left: 68 }}
        padding={0.28}
        innerPadding={2}
        borderRadius={4}
        enableLabel={false}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 5,
          format: (v) => formatCurrency(Number(v), currency).replace(/[,.]\d{2}$/, ''),
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom',
            direction: 'row',
            translateY: 48,
            itemWidth: 90,
            itemHeight: 16,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
        tooltip={({ id, value, indexValue, color }) => (
          <ChartTooltip
            title={indexValue}
            rows={[{ color, label: id, value: formatCurrency(Number(value), currency) }]}
          />
        )}
        role="img"
        ariaLabel="Comparación mensual de ingresos y gastos"
      />
    </ChartCard>
  )
}
