'use client'

import { Field, NumberInput, Text } from '@chakra-ui/react'

interface Props {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  helperText?: string
  isRequired?: boolean
  isDisabled?: boolean
}

/**
 * Integer percentage 0–100 on Chakra's NumberInput: own +/- buttons instead of
 * the browser's spinner, clamped to the range on blur. Empty emits undefined.
 */
export function InputPercent({ label, value, onChange, helperText, isRequired, isDisabled }: Props) {
  return (
    <Field.Root required={isRequired} disabled={isDisabled} width="100%">
      <Field.Label>{label}</Field.Label>
      <NumberInput.Root
        value={value === undefined ? '' : String(value)}
        onValueChange={(e) =>
          onChange(e.value === '' || Number.isNaN(e.valueAsNumber) ? undefined : e.valueAsNumber)
        }
        min={0}
        max={100}
        step={1}
        clampValueOnBlur
        allowMouseWheel={false}
        formatOptions={{ maximumFractionDigits: 0 }}
        locale="es-CO"
        colorPalette="brand"
        width="100%"
      >
        <NumberInput.Control>
          <NumberInput.IncrementTrigger aria-label="Aumentar porcentaje" />
          <NumberInput.DecrementTrigger aria-label="Disminuir porcentaje" />
        </NumberInput.Control>
        <NumberInput.Input placeholder="0" inputMode="numeric" pe="12" />
        {/* Suffix sits left of the +/- control, which the recipe pins to the right edge. */}
        <Text
          position="absolute"
          insetEnd="8"
          top="50%"
          transform="translateY(-50%)"
          color="text.secondary"
          pointerEvents="none"
          aria-hidden
        >
          %
        </Text>
      </NumberInput.Root>
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
    </Field.Root>
  )
}
