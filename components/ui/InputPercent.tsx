'use client'

import { FieldRoot, FieldLabel, FieldHelperText, InputGroup, Input } from '@chakra-ui/react'

interface Props {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  helperText?: string
  isRequired?: boolean
  isDisabled?: boolean
}

export function InputPercent({ label, value, onChange, helperText, isRequired, isDisabled }: Props) {
  return (
    <FieldRoot required={isRequired} disabled={isDisabled} width="100%">
      <FieldLabel>{label}</FieldLabel>
      <InputGroup endElement="%">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={1}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange(undefined)
            const parsed = Number(raw)
            onChange(Number.isFinite(parsed) ? parsed : undefined)
          }}
          placeholder="0"
        />
      </InputGroup>
      {helperText && <FieldHelperText>{helperText}</FieldHelperText>}
    </FieldRoot>
  )
}
