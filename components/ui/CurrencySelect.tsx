'use client'

import { ComboboxField } from './ComboboxField'
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
    <ComboboxField
      label="Moneda"
      value={value}
      // Options only contain Currency values and clearing is disabled.
      onChange={(v) => onChange(v as Currency)}
      options={currencies.map((c) => ({ value: c.value, label: showFullLabel ? c.full : c.short }))}
      required={required}
      disabled={disabled}
      clearable={false}
    />
  )
}
