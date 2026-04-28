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
  disabled?: boolean
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
  disabled,
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
        disabled={disabled}
        opacity={disabled ? 0.6 : 1}
        cursor={disabled ? 'not-allowed' : undefined}
      />
    </FieldRoot>
  )
}
