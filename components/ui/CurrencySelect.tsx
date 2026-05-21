'use client'

import { Box, FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'
import type { Currency } from '@/types/database.types'

interface Props {
  value: Currency
  onChange: (value: Currency) => void
  showFullLabel?: boolean
  required?: boolean
  disabled?: boolean
}

const currencies: { value: Currency; short: string; full: string }[] = [
  { value: 'COP', short: 'COP', full: 'COP - Peso Colombiano' },
  { value: 'USD', short: 'USD', full: 'USD - Dólar' },
  { value: 'VES', short: 'VES', full: 'VES - Bolívar (Bs)' },
]

export function CurrencySelect({ value, onChange, showFullLabel = false, required, disabled }: Props) {
  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>Moneda</FieldLabel>
      <Box w="full" opacity={disabled ? 0.6 : 1} cursor={disabled ? 'not-allowed' : undefined} pointerEvents={disabled ? 'none' : undefined}>
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
      </Box>
    </FieldRoot>
  )
}
