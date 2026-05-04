'use client'

import { FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface Props {
  value: Frequency
  onChange: (value: Frequency) => void
  required?: boolean
}

export function FrequencySelect({ value, onChange, required }: Props) {
  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>Frecuencia</FieldLabel>
      <NativeSelectRoot>
        <NativeSelectField
          value={value}
          onChange={(e) => onChange(e.target.value as Frequency)}
        >
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </NativeSelectField>
      </NativeSelectRoot>
    </FieldRoot>
  )
}
