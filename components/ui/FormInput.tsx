'use client'

import { FieldRoot, FieldLabel, Input } from '@chakra-ui/react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date'
  placeholder?: string
  required?: boolean
  step?: string
  min?: string
}

export function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  step,
  min,
}: Props) {
  return (
    <FieldRoot required={required}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
      />
    </FieldRoot>
  )
}
