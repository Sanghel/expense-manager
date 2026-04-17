'use client'

import { FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import type { Currency } from '@/types/database.types'

interface Props {
  value: Currency
  onChange: (value: Currency) => void
  showFullLabel?: boolean
  required?: boolean
}

const currencies: { value: Currency; short: string; full: string }[] = [
  { value: 'COP', short: 'COP', full: 'COP - Peso Colombiano' },
  { value: 'USD', short: 'USD', full: 'USD - Dólar' },
  { value: 'VES', short: 'VES', full: 'VES - Bolívar (Bs)' },
]

export function CurrencySelect({ value, onChange, showFullLabel = false, required }: Props) {
  return (
    <FieldRoot required={required}>
      <FieldLabel>Moneda</FieldLabel>
      <NativeSelectRoot>
        <NativeSelectField
          value={value}
          onChange={(e) => onChange(e.target.value as Currency)}
        >
          {currencies.map((c) => (
            <option key={c.value} value={c.value}>
              {showFullLabel ? c.full : c.short}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    </FieldRoot>
  )
}
