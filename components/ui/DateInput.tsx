'use client'

import { FieldRoot, FieldLabel, Input, Flex, IconButton } from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  optional?: boolean
}

export function DateInput({ label, value, onChange, required, disabled, optional }: Props) {
  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>
        {label}
        {optional && <span style={{ color: '#B0B0B0', fontSize: '0.85em', marginLeft: '4px' }}>(opcional)</span>}
      </FieldLabel>
      <Flex gap={1} w="full">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          opacity={disabled ? 0.6 : 1}
          cursor={disabled ? 'not-allowed' : undefined}
          flex={1}
        />
        {value && !disabled && (
          <IconButton
            aria-label="Limpiar fecha"
            variant="ghost"
            size="sm"
            color="#B0B0B0"
            _hover={{ color: 'white', bg: '#26262f' }}
            onClick={() => onChange('')}
            flexShrink={0}
          >
            <FiX />
          </IconButton>
        )}
      </Flex>
    </FieldRoot>
  )
}
