'use client'

import { ResponsiveBar } from '@nivo/bar'
import { ChartCard } from './ChartCard'
import { nivoTheme, seriesColor } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import { safeRatio } from '@/lib/utils/numbers'
import type { Currency } from '@/types/database.types'

interface Row {
  id: string
  label: string
  icon?: string | null
  value: number
}

interface Props {
  title: string
  subtitle?: string
  data: Row[]
  currency: Currency
  /** Keeps a fixed colour per slot when the caller has a stable order. */
  colorIndex?: number
  height?: number
}

export function BreakdownBarChart({
  title,
  subtitle,
  data,
  currency,
  colorIndex,
  height = 260,
}: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const chartData = data.map((d, i) => ({
    id: d.id,
    label: d.icon ? `${d.icon} ${d.label}` : d.label,
    value: Math.round(d.value),
    color: seriesColor(colorIndex ?? i),
  }))

  return (
    <ChartCard title={title} subtitle={subtitle} height={height} isEmpty={total <= 0}>
      <ResponsiveBar
        data={chartData}
        keys={['value']}
        indexBy="label"
        theme={nivoTheme}
        colors={(bar) => (bar.data as { color: string }).color}
        margin={{ top: 12, right: 12, bottom: 48, left: 68 }}
        padding={0.35}
        borderRadius={4}
        enableLabel={false}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 4,
          format: (v) => formatCurrency(Number(v), currency).replace(/[,.]\d{2}$/, ''),
        }}
        tooltip={({ data: d, value }) => (
          <div>
            <strong>{d.label}</strong>
            <br />
            {formatCurrency(Number(value), currency)}
            <br />
            <span style={{ opacity: 0.7 }}>
              {(safeRatio(Number(value), total) * 100).toFixed(1)}% del total
            </span>
          </div>
        )}
        role="img"
        ariaLabel={title}
      />
    </ChartCard>
  )
}
