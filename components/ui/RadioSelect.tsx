'use client'

import {
  FieldRoot,
  FieldLabel,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupItemHiddenInput,
  HStack,
} from '@chakra-ui/react'

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

export function RadioSelect({ label, value, onChange, options, required }: Props) {
  return (
    <FieldRoot required={required}>
      <FieldLabel>{label}</FieldLabel>
      <RadioGroupRoot
        value={value}
        onValueChange={({ value: v }) => onChange(v ?? '')}
        colorPalette="brand"
      >
        <HStack gap={4}>
          {options.map((opt) => (
            <RadioGroupItem key={opt.value} value={opt.value}>
              <RadioGroupItemHiddenInput />
              <RadioGroupItemControl
                borderColor="#4F46E5"
                _checked={{ bg: '#4F46E5', borderColor: '#4F46E5' }}
              />
              <RadioGroupItemText>{opt.label}</RadioGroupItemText>
            </RadioGroupItem>
          ))}
        </HStack>
      </RadioGroupRoot>
    </FieldRoot>
  )
}
