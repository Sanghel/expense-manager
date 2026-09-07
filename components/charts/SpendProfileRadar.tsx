'use client'

import { ResponsiveRadar } from '@nivo/radar'
import { ChartCard } from './ChartCard'
import { nivoTheme, CATEGORICAL_ALL_PAIRS } from './nivo-theme'
import { formatCurrency } from '@/lib/utils/currency'
import type { Currency } from '@/types/database.types'

interface Props {
  data: { axis: string; current: number; previous: number }[]
  currency: Currency
}

export function SpendProfileRadar({ data, currency }: Props) {
  // A radar compares every series against every other, so it stays inside the
  // three slots that clear the all-pairs separation floors.
  const chartData = data.map((d) => ({
    axis: d.axis,
    Actual: Math.round(d.current),
    Anterior: Math.round(d.previous),
  }))

  return (
    <ChartCard
      title="Perfil de Gasto"
      subtitle="Forma del gasto por grupo, comparada con el periodo anterior de igual duración"
      height={340}
      isEmpty={chartData.length < 3}
      emptyMessage="Se necesitan al menos 3 grupos o categorías con gasto para dibujar el perfil."
    >
      <ResponsiveRadar
        data={chartData}
        keys={['Actual', 'Anterior']}
        indexBy="axis"
        theme={nivoTheme}
        colors={[CATEGORICAL_ALL_PAIRS[0], CATEGORICAL_ALL_PAIRS[1]]}
        margin={{ top: 40, right: 60, bottom: 60, left: 60 }}
        gridShape="circular"
        gridLabelOffset={12}
        borderWidth={2}
        fillOpacity={0.18}
        dotSize={8}
        dotBorderWidth={2}
        dotColor="#1a1a23"
        dotBorderColor={{ from: 'color' }}
        valueFormat={(v) => formatCurrency(Number(v), currency)}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 44,
            itemWidth: 90,
            itemHeight: 16,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
      />
    </ChartCard>
  )
}
