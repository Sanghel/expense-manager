'use client'

import { FieldRoot, FieldLabel, Input, Box, IconButton } from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  optional?: boolean
  showClear?: boolean
}

export function DateInput({ label, value, onChange, required, disabled, optional, showClear = true }: Props) {
  const showButton = showClear && value && !disabled

  return (
    <FieldRoot required={required} w="full">
      <FieldLabel>
        {label}
        {optional && <span style={{ color: '#B0B0B0', fontSize: '0.85em', marginLeft: '4px' }}>(opcional)</span>}
      </FieldLabel>
      <Box position="relative" w="full">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          opacity={disabled ? 0.6 : 1}
          cursor={disabled ? 'not-allowed' : undefined}
          pr={showButton ? '8' : undefined}
        />
        {showButton && (
          <IconButton
            aria-label="Limpiar fecha"
            variant="ghost"
            size="xs"
            position="absolute"
            right="1"
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            color="#B0B0B0"
            _hover={{ color: 'white', bg: '#26262f' }}
            onClick={() => onChange('')}
            minW="auto"
            h="auto"
            p="1"
          >
            <FiX />
          </IconButton>
        )}
      </Box>
    </FieldRoot>
  )
}
