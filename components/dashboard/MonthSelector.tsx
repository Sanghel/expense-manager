'use client'

import { DatePicker, HStack, parseDate } from '@chakra-ui/react'
import { FloatingPortal } from '@/components/ui/FloatingPortal'
import { LuCalendar } from 'react-icons/lu'
import { ActionIconButton } from '@/components/ui/ActionIconButton'

type DateValue = NonNullable<DatePicker.RootProps['value']>[number]

interface Props {
  /** `YYYY-MM` */
  value: string
  onChange: (month: string) => void
}

const pad = (n: number) => String(n).padStart(2, '0')
const toMonth = (d: { year: number; month: number }) => `${d.year}-${pad(d.month)}`
const firstDay = (month: string) => parseDate(`${month}-01`) as DateValue

/** Month `offset` months away from `month`, computed on year/month numbers (no UTC shifts). */
function shiftMonth(month: string, offset: number): string {
  const [year, m] = month.split('-').map(Number)
  const index = year * 12 + (m - 1) + offset
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

/** "Septiembre 2026" */
function monthLabel(d: { year: number; month: number }): string {
  const name = new Date(d.year, d.month - 1, 1).toLocaleDateString('es', { month: 'long' })
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${d.year}`
}

/** Month picker limited to the last 12 months (same range as before). */
export function MonthSelector({ value, onChange }: Props) {
  const now = new Date()
  const maxMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  const minMonth = shiftMonth(maxMonth, -11)

  return (
    <HStack gap={1} maxW="290px">
      <ActionIconButton
        kind="prev"
        label="Mes anterior"
        variant="outline"
        disabled={value <= minMonth}
        onClick={() => onChange(shiftMonth(value, -1))}
      />
      <DatePicker.Root
        value={[firstDay(value)]}
        onValueChange={(e) => e.value[0] && onChange(toMonth(e.value[0]))}
        defaultView="month"
        minView="month"
        min={firstDay(minMonth)}
        max={firstDay(maxMonth)}
        locale="es-CO"
        format={monthLabel}
        colorPalette="brand"
        size="sm"
        flex="1"
        minW={0}
      >
        <DatePicker.Control>
          <DatePicker.Input readOnly aria-label="Mes" cursor="pointer" />
          <DatePicker.IndicatorGroup>
            <DatePicker.Trigger aria-label="Elegir mes">
              <LuCalendar />
            </DatePicker.Trigger>
          </DatePicker.IndicatorGroup>
        </DatePicker.Control>
        <FloatingPortal>
          <DatePicker.Positioner>
            <DatePicker.Content colorPalette="brand">
              <DatePicker.View view="month">
                <DatePicker.Header />
                <DatePicker.MonthTable />
              </DatePicker.View>
              <DatePicker.View view="year">
                <DatePicker.Header />
                <DatePicker.YearTable />
              </DatePicker.View>
            </DatePicker.Content>
          </DatePicker.Positioner>
        </FloatingPortal>
      </DatePicker.Root>
      <ActionIconButton
        kind="next"
        label="Mes siguiente"
        variant="outline"
        disabled={value >= maxMonth}
        onClick={() => onChange(shiftMonth(value, 1))}
      />
    </HStack>
  )
}
