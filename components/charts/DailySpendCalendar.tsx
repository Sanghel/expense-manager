'use client'

import { ResponsiveCalendar } from '@nivo/calendar'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { nivoTheme, SEQUENTIAL, BORDER } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

interface Props {
  data: { day: string; value: number }[]
  currency: Currency
  from: string
  to: string
}

export function DailySpendCalendar({ data, currency, from, to }: Props) {
  return (
    <ChartCard
      title="Intensidad Diaria de Gasto"
      subtitle="Un solo tono: cuanto más claro, más se gastó ese día"
      height={220}
      isEmpty={data.length === 0}
    >
      <ResponsiveCalendar
        data={data.map((d) => ({ day: d.day, value: Math.round(d.value) }))}
        from={from}
        to={to}
        theme={nivoTheme}
        colors={SEQUENTIAL}
        emptyColor="#22222c"
        margin={{ top: 20, right: 20, bottom: 8, left: 20 }}
        yearSpacing={36}
        monthBorderColor={BORDER}
        dayBorderWidth={2}
        dayBorderColor="#0f0f13"
        tooltip={({ day, value, color }) => (
          <ChartTooltip
            title={new Date(`${day}T12:00:00`).toLocaleDateString('es-CO')}
            rows={[
              {
                color,
                label: 'Gasto',
                value: formatCurrency(Number(value), currency),
              },
            ]}
          />
        )}
      />
    </ChartCard>
  )
}
