'use client'

import { ResponsiveBar } from '@nivo/bar'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { nivoTheme, seriesColor } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

interface Props {
  data: { month: string; recurring: number; oneOff: number }[]
  currency: Currency
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  })
}

export function RecurringSplitChart({ data, currency }: Props) {
  const chartData = data.map((d) => {
    const total = d.recurring + d.oneOff || 1
    return {
      month: monthLabel(d.month),
      Fijo: Math.round((d.recurring / total) * 100),
      Variable: Math.round((d.oneOff / total) * 100),
      _recurring: d.recurring,
      _oneOff: d.oneOff,
    }
  })

  return (
    <ChartCard
      title="Gasto Fijo vs. Variable"
      subtitle="Fijo = el gasto que coincide con un recordatorio activo"
      height={280}
      isEmpty={chartData.length === 0}
    >
      <ResponsiveBar
        data={chartData}
        keys={['Fijo', 'Variable']}
        indexBy="month"
        theme={nivoTheme}
        colors={[seriesColor(0), seriesColor(1)]}
        margin={{ top: 16, right: 16, bottom: 56, left: 48 }}
        padding={0.3}
        innerPadding={2}
        borderRadius={4}
        enableLabel={false}
        valueScale={{ type: 'linear', min: 0, max: 100 }}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 5, format: (v) => `${v}%` }}
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
        tooltip={({ id, value, data: d, color }) => (
          <ChartTooltip
            title={d.month}
            rows={[
              { color, label: id, value: `${value}%` },
              {
                muted: true,
                label: 'Monto',
                value: formatCurrency(id === 'Fijo' ? d._recurring : d._oneOff, currency),
              },
            ]}
          />
        )}
        role="img"
        ariaLabel="Proporción de gasto fijo y variable por mes"
      />
    </ChartCard>
  )
}
