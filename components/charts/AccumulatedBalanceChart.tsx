'use client'

import { ResponsiveLine } from '@nivo/line'
import { Text } from '@chakra-ui/react'
import { ChartCard } from './ChartCard'
import { nivoTheme, BRAND, INCOME, EXPENSE } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

interface Props {
  data: { date: string; balance: number }[]
  currency: Currency
}

const MAX_POINTS = 30

export function AccumulatedBalanceChart({ data, currency }: Props) {
  const points = data.slice(-MAX_POINTS)
  const latest = points.at(-1)?.balance ?? 0

  const series = [
    {
      id: 'Balance',
      data: points.map((d) => ({
        x: new Date(`${d.date}T12:00:00`).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short',
        }),
        y: Math.round(d.balance),
      })),
    },
  ]

  return (
    <ChartCard
      title="Balance Acumulado"
      subtitle={points.length === MAX_POINTS ? `Últimos ${MAX_POINTS} días con movimiento` : undefined}
      headline={
        <Text fontSize="lg" fontWeight="bold" color={latest >= 0 ? INCOME : EXPENSE}>
          {formatCurrency(latest, currency)}
        </Text>
      }
      height={300}
      isEmpty={points.length === 0}
    >
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        colors={[BRAND]}
        margin={{ top: 16, right: 20, bottom: 56, left: 68 }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        curve="monotoneX"
        lineWidth={2}
        pointSize={8}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointColor="#1a1a23"
        enableArea
        areaOpacity={0.18}
        enableGridX={false}
        useMesh
        enableCrosshair
        crosshairType="x"
        axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -40 }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 5,
          format: (v) => formatCurrency(Number(v), currency).replace(/[,.]\d{2}$/, ''),
        }}
        tooltip={({ point }) => (
          <div>
            <strong>{String(point.data.x)}</strong>
            <br />
            {formatCurrency(Number(point.data.y), currency)}
          </div>
        )}
      />
    </ChartCard>
  )
}
