'use client'

import { ResponsiveRadialBar } from '@nivo/radial-bar'
import { ChartCard } from './ChartCard'
import { nivoTheme, seriesColor, EXPENSE, ACCENT } from './nivo-theme'

interface Props {
  data: { id: string; label: string; percent: number }[]
}

/** Consumption is a state, so over-budget and near-budget get status colours. */
function usageColor(percent: number, index: number): string {
  if (percent > 100) return EXPENSE
  if (percent > 80) return ACCENT
  return seriesColor(index)
}

export function BudgetUsagePolarChart({ data }: Props) {
  const chartData = data.map((d, i) => ({
    id: d.label,
    data: [{ x: 'Consumido', y: Math.min(d.percent, 150) }],
    color: usageColor(d.percent, i),
  }))

  const percentById = new Map(data.map((d) => [d.label, d.percent]))

  return (
    <ChartCard
      title="Gasto vs. Presupuesto"
      subtitle="Cada arco es un presupuesto; el relleno es el % consumido de su límite"
      height={340}
      isEmpty={chartData.length === 0}
      emptyMessage="Crea un presupuesto para ver su consumo aquí."
    >
      <ResponsiveRadialBar
        data={chartData}
        theme={nivoTheme}
        colors={(bar) => (bar.data as unknown as { color: string }).color}
        maxValue={150}
        valueFormat={(v) => `${Math.round(v)}%`}
        startAngle={-120}
        endAngle={120}
        innerRadius={0.3}
        padding={0.35}
        cornerRadius={4}
        margin={{ top: 8, right: 8, bottom: 64, left: 8 }}
        tracksColor="#22222c"
        enableRadialGrid={false}
        circularAxisOuter={{ tickSize: 0, tickPadding: 10 }}
        radialAxisStart={{ tickSize: 0, tickPadding: 8 }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 52,
            itemsSpacing: 6,
            itemWidth: 110,
            itemHeight: 16,
            symbolSize: 10,
            itemDirection: 'left-to-right',
          },
        ]}
        tooltip={({ bar }) => (
          <div>
            <strong>{bar.groupId}</strong>
            <br />
            {percentById.get(bar.groupId) ?? 0}% consumido
          </div>
        )}
      />
    </ChartCard>
  )
}
