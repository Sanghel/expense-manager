'use client'

import { ComboboxField } from './ComboboxField'

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface Props {
  value: Frequency
  onChange: (value: Frequency) => void
  required?: boolean
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

export function FrequencySelect({ value, onChange, required }: Props) {
  return (
    <ComboboxField
      label="Frecuencia"
      value={value}
      // Options only contain Frequency values and clearing is disabled.
      onChange={(v) => onChange(v as Frequency)}
      options={FREQUENCIES}
      required={required}
      clearable={false}
    />
  )
}
