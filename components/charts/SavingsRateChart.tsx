'use client'

import { ResponsiveLine } from '@nivo/line'
import { Text } from '@chakra-ui/react'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { nivoTheme, INCOME, EXPENSE, BRAND } from './nivo-theme'

interface Props {
  data: { month: string; rate: number | null }[]
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  })
}

export function SavingsRateChart({ data }: Props) {
  // Months with no income carry no rate; averaging them in as 0 would drag the
  // headline down for a month where simply nothing came in.
  const rated = data.filter((d): d is { month: string; rate: number } => d.rate !== null)
  const average = rated.length
    ? rated.reduce((sum, d) => sum + d.rate, 0) / rated.length
    : 0

  const series = [
    {
      id: 'Tasa de ahorro',
      // `null` breaks the line across the gap instead of dropping to zero.
      data: data.map((d) => ({
        x: monthLabel(d.month),
        y: d.rate === null ? null : Math.round(d.rate),
      })),
    },
  ]

  return (
    <ChartCard
      title="Tasa de Ahorro"
      subtitle="Qué porcentaje de lo que ingresas te queda cada mes · últimos 12 meses"
      headline={
        <Text fontSize="lg" fontWeight="bold" color={average >= 0 ? INCOME : EXPENSE}>
          {average.toFixed(0)}%
        </Text>
      }
      height={280}
      isEmpty={rated.length === 0}
      emptyMessage="Sin ingresos registrados en los últimos meses, así que no hay tasa de ahorro que calcular."
    >
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        colors={[BRAND]}
        margin={{ top: 16, right: 20, bottom: 48, left: 52 }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
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
        markers={[
          {
            axis: 'y',
            value: 0,
            lineStyle: { stroke: '#2d2d35', strokeWidth: 1 },
            legend: '',
          },
        ]}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 5, format: (v) => `${v}%` }}
        tooltip={({ point }) => (
          <ChartTooltip
            title={String(point.data.x)}
            rows={[
              {
                color: point.seriesColor,
                label: 'Ahorrado',
                value: `${Number(point.data.y)}%`,
              },
            ]}
          />
        )}
      />
    </ChartCard>
  )
}
