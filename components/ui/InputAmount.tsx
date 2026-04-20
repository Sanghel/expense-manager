'use client'

import { useState, useEffect } from 'react'
import { FieldRoot, FieldLabel, FieldErrorText, Input } from '@chakra-ui/react'

interface InputAmountProps {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
  isRequired?: boolean
  isInvalid?: boolean
  errorMessage?: string
  isDisabled?: boolean
}

const formatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(value: number | undefined): string {
  if (value === undefined || value === 0) return ''
  return formatter.format(value)
}

function parseAmount(raw: string): number | undefined {
  // Remove thousands separators (.) and replace decimal comma with dot
  const cleaned = raw.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? undefined : parsed
}

export function InputAmount({
  label,
  value,
  onChange,
  placeholder = '0,00',
  isRequired,
  isInvalid,
  errorMessage,
  isDisabled,
}: InputAmountProps) {
  const [focused, setFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  useEffect(() => {
    if (!focused) {
      setRawInput(formatAmount(value))
    }
  }, [value, focused])

  function handleFocus() {
    setFocused(true)
    // Show raw number for easy editing (comma as decimal)
    setRawInput(value !== undefined && value !== 0 ? String(value).replace('.', ',') : '')
  }

  function handleBlur() {
    setFocused(false)
    const parsed = parseAmount(rawInput)
    onChange(parsed)
    setRawInput(formatAmount(parsed))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow digits, dot (thousands), comma (decimal), minus
    const val = e.target.value.replace(/[^0-9.,\-]/g, '')
    setRawInput(val)
  }

  return (
    <FieldRoot required={isRequired} invalid={isInvalid} disabled={isDisabled} width="100%">
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="text"
        inputMode="decimal"
        value={focused ? rawInput : formatAmount(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {isInvalid && errorMessage && <FieldErrorText>{errorMessage}</FieldErrorText>}
    </FieldRoot>
  )
}
