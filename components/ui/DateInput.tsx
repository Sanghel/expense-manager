'use client'

import { DatePicker, Field, Text, parseDate } from '@chakra-ui/react'
import { FloatingPortal } from './FloatingPortal'
import { LuCalendar } from 'react-icons/lu'

type DateValue = NonNullable<DatePicker.RootProps['value']>[number]

const pad = (n: number) => String(n).padStart(2, '0')

/** Calendar date → ISO `YYYY-MM-DD` (no time, no timezone: the day never shifts). */
function toIso(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`
}

function isoToDate(iso: string): DateValue | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined
  try {
    return parseDate(iso) as DateValue
  } catch {
    return undefined
  }
}

/** Accepts DD/MM/YYYY typed by hand; anything else is not a date yet. */
function parseDisplay(text: string): DateValue | undefined {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return undefined
  const [, day, month, year] = match
  const date = isoToDate(`${year}-${pad(Number(month))}-${pad(Number(day))}`)
  // parseDate constrains out-of-range days (31/02 → 28/02); reject those instead.
  return date && date.day === Number(day) && date.month === Number(month) ? date : undefined
}

interface Props {
  label: string
  /** ISO `YYYY-MM-DD` or ''. */
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  optional?: boolean
  showClear?: boolean
}

/**
 * Date field on Chakra's DatePicker: typed DD/MM/YYYY or picked from a Spanish
 * calendar starting on Monday. Emits the same ISO string as before, or ''.
 */
export function DateInput({ label, value, onChange, required, disabled, optional, showClear = true }: Props) {
  const date = isoToDate(value)

  return (
    <Field.Root required={required} disabled={disabled} w="full">
      <DatePicker.Root
        value={date ? [date] : []}
        onValueChange={(e) => onChange(e.value[0] ? toIso(e.value[0]) : '')}
        locale="es-CO"
        startOfWeek={1}
        format={(d) => `${pad(d.day)}/${pad(d.month)}/${d.year}`}
        parse={(text) => parseDisplay(text)}
        placeholder="DD/MM/AAAA"
        colorPalette="brand"
        width="full"
      >
        <DatePicker.Label>
          {label}
          {required && <Field.RequiredIndicator />}
          {optional && (
            <Text as="span" color="text.secondary" fontSize="0.85em" fontWeight="normal" ms={1}>
              (opcional)
            </Text>
          )}
        </DatePicker.Label>
        <DatePicker.Control>
          <DatePicker.Input />
          <DatePicker.IndicatorGroup>
            {showClear && value && <DatePicker.ClearTrigger aria-label="Limpiar fecha" />}
            <DatePicker.Trigger aria-label="Abrir calendario">
              <LuCalendar />
            </DatePicker.Trigger>
          </DatePicker.IndicatorGroup>
        </DatePicker.Control>
        <FloatingPortal>
          <DatePicker.Positioner>
            <DatePicker.Content colorPalette="brand">
              <DatePicker.View view="day">
                <DatePicker.Header />
                <DatePicker.DayTable />
              </DatePicker.View>
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
    </Field.Root>
  )
}
