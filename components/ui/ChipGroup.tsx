'use client'

import { Button, Flex, FlexProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface ChipOption<T extends string> {
  value: T
  label: ReactNode
  /** Emoji or icon shown before the label. */
  icon?: ReactNode
}

interface Props<T extends string> extends Omit<FlexProps, 'onChange'> {
  options: ChipOption<T>[]
  value: T | null
  onChange: (value: T) => void
  label?: string
}

/** Single-select pill chips. Selected: brandSoft fill with a brand ring. */
export function ChipGroup<T extends string>({ options, value, onChange, label, ...props }: Props<T>) {
  return (
    <Flex role="radiogroup" aria-label={label} wrap="wrap" gap={2} {...props}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Button
            key={option.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            h="36px"
            px={4}
            gap={2}
            fontSize="sm"
            fontWeight="medium"
            bg={selected ? 'brandSoft' : 'surface2'}
            color={selected ? 'brand' : 'text'}
            boxShadow={selected ? 'inset 0 0 0 1.5px var(--chakra-colors-brand)' : 'none'}
            _hover={{ bg: selected ? 'brandSoft' : 'line' }}
            transition="background 150ms, color 150ms"
          >
            {option.icon}
            {option.label}
          </Button>
        )
      })}
    </Flex>
  )
}
