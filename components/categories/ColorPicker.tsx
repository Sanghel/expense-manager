'use client'

import { Box, chakra } from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'

const StyledButton = chakra('button')

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#78716c',
  '#84cc16',
  '#06b6d4',
  '#a855f7',
]

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <Box position="relative" ref={ref}>
      <StyledButton
        type="button"
        onClick={() => setOpen((v) => !v)}
        w="9"
        h="9"
        borderRadius="md"
        bg={value}
        border="2px solid"
        borderColor={open ? 'gray.700' : 'gray.300'}
        cursor="pointer"
        _hover={{ borderColor: 'gray.500' }}
        transition="border-color 0.15s"
      />

      {open && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          right={0}
          zIndex={50}
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="lg"
          p={3}
          w="50"
        >
          <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
            {COLORS.map((color) => (
              <StyledButton
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setOpen(false)
                }}
                w="7"
                h="7"
                borderRadius="md"
                bg={color}
                border="2px solid"
                borderColor={value === color ? 'gray.800' : 'transparent'}
                cursor="pointer"
                _hover={{ transform: 'scale(1.15)' }}
                transition="transform 0.1s"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
