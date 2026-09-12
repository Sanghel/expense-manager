'use client'

import { useMemo, memo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { nivoTheme, INCOME, EXPENSE } from '@/components/charts/nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import { toNumber } from '@/lib/utils/numbers'
import type { Currency, TransactionWithCategory } from '@/types/database.types'

interface ChartDataPoint {
  month: string
  income: number
  expense: number
}

interface Props {
  transactions: TransactionWithCategory[]
  currency?: Currency
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  })
}

export const MonthlyTrendChart = memo(function MonthlyTrendChart({
  transactions,
  currency = 'COP',
}: Props) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const grouped = transactions.reduce<Record<string, ChartDataPoint>>((acc, t) => {
      const month = t.date.slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 }
      }
      if (t.type === 'income') {
        acc[month].income += toNumber(t.amount)
      } else {
        acc[month].expense += toNumber(t.amount)
      }
      return acc
    }, {})

    return Object.values(grouped)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
  }, [transactions])

  const series = [
    {
      id: 'Ingresos',
      data: chartData.map((d) => ({ x: monthLabel(d.month), y: Math.round(d.income) })),
    },
    {
      id: 'Gastos',
      data: chartData.map((d) => ({ x: monthLabel(d.month), y: Math.round(d.expense) })),
    },
  ]

  return (
    <ChartCard
      title="Tendencia Mensual"
      height={280}
      isEmpty={chartData.length === 0}
      emptyMessage="No hay suficientes datos para mostrar."
    >
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        colors={[INCOME, EXPENSE]}
        margin={{ top: 12, right: 20, bottom: 56, left: 68 }}
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        curve="monotoneX"
        lineWidth={2}
        pointSize={8}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointColor="#1a1a23"
        enableGridX={false}
        useMesh
        enableCrosshair
        crosshairType="x"
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 5,
          format: (v) => formatCurrency(Number(v), currency).replace(/[,.]\d{2}$/, ''),
        }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 48,
            itemWidth: 90,
            itemHeight: 16,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
        tooltip={({ point }) => (
          <ChartTooltip
            title={String(point.data.x)}
            rows={[
              {
                color: point.seriesColor,
                label: point.seriesId,
                value: formatCurrency(Number(point.data.y), currency),
              },
            ]}
          />
        )}
      />
    </ChartCard>
  )
})
