'use client'

import { ResponsiveLine } from '@nivo/line'
import { Text } from '@chakra-ui/react'
import { ChartCard } from './ChartCard'
import { nivoTheme, INCOME, EXPENSE, BRAND } from './nivo-theme'

interface Props {
  data: { month: string; rate: number }[]
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
  })
}

export function SavingsRateChart({ data }: Props) {
  const average = data.length
    ? data.reduce((sum, d) => sum + d.rate, 0) / data.length
    : 0

  const series = [
    {
      id: 'Tasa de ahorro',
      data: data.map((d) => ({ x: monthLabel(d.month), y: Math.round(d.rate) })),
    },
  ]

  return (
    <ChartCard
      title="Tasa de Ahorro"
      subtitle="Qué porcentaje de lo que ingresas te queda cada mes"
      headline={
        <Text fontSize="lg" fontWeight="bold" color={average >= 0 ? INCOME : EXPENSE}>
          {average.toFixed(0)}%
        </Text>
      }
      height={280}
      isEmpty={data.length === 0}
    >
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        colors={[BRAND]}
        margin={{ top: 16, right: 20, bottom: 48, left: 52 }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
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
          <div>
            <strong>{String(point.data.x)}</strong>
            <br />
            {Number(point.data.y)}% ahorrado
          </div>
        )}
      />
    </ChartCard>
  )
}
