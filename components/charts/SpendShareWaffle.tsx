'use client'

import { ResponsiveWaffle } from '@nivo/waffle'
import { ChartCard } from './ChartCard'
import { nivoTheme, seriesColor, TEXT_MUTED } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import type { NamedAmount } from '@/lib/actions/reports.actions'
import type { Currency } from '@/types/database.types'

interface Props {
  data: NamedAmount[]
  total: number
  currency: Currency
  title: string
  subtitle?: string
}

/** Past this many slices the rest folds into "Otros" — hues are never cycled. */
const MAX_SLICES = 7

export function SpendShareWaffle({ data, total, currency, title, subtitle }: Props) {
  const top = data.slice(0, MAX_SLICES)
  const restValue = data.slice(MAX_SLICES).reduce((sum, d) => sum + d.value, 0)

  const slices = [
    ...top.map((d, i) => ({
      id: d.id,
      label: `${d.icon ?? ''} ${d.label}`.trim(),
      value: safeRatio(d.value, total) * 100,
      amount: d.value,
      color: seriesColor(i),
    })),
    ...(restValue > 0
      ? [
          {
            id: 'otros',
            label: 'Otros',
            value: safeRatio(restValue, total) * 100,
            amount: restValue,
            color: TEXT_MUTED,
          },
        ]
      : []),
  ]

  return (
    <ChartCard
      title={title}
      subtitle={subtitle ?? 'Cada celda es 1 % del gasto del periodo'}
      height={320}
      isEmpty={total <= 0 || slices.length === 0}
    >
      <ResponsiveWaffle
        data={slices}
        total={100}
        rows={10}
        columns={10}
        theme={nivoTheme}
        colors={(d) => (d as unknown as { color: string }).color}
        borderRadius={2}
        emptyColor="#22222c"
        margin={{ top: 4, right: 4, bottom: 64, left: 4 }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 56,
            itemsSpacing: 6,
            itemWidth: 110,
            itemHeight: 16,
            symbolSize: 10,
            itemDirection: 'left-to-right',
          },
        ]}
        tooltip={({ data: d }) => (
          <div>
            <strong>{d.label}</strong>
            <br />
            {formatCurrency((d as unknown as { amount: number }).amount, currency)}
            <br />
            <span style={{ opacity: 0.7 }}>{d.value.toFixed(1)}% del gasto</span>
          </div>
        )}
      />
    </ChartCard>
  )
}
