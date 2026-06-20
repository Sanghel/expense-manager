'use client'

import { FieldRoot, FieldLabel, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  required?: boolean
}

/**
 * Labeled dropdown built on Chakra's NativeSelect. Reusable across forms
 * (reminder type/frequency, account type, …).
 */
export function SelectField({ label, value, onChange, options, required }: Props) {
  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>{label}</FieldLabel>
      <NativeSelectRoot>
        <NativeSelectField value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>
    </FieldRoot>
  )
}
