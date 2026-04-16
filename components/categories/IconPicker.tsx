'use client'

import { Box, Input, SimpleGrid, Text, chakra } from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'

const StyledButton = chakra('button')

const ICONS = [
  '🍔', '🍕', '🍜', '🍣', '☕', '🛒', '🏠', '🚗', '✈️', '🚌',
  '💊', '🏋️', '🎮', '🎬', '📚', '👗', '👟', '💄', '🐾', '🎁',
  '💼', '💻', '📱', '🔧', '⚡', '💡', '🌊', '🌿', '🏖️', '🎵',
  '💰', '💳', '🏦', '📈', '💸', '🎓', '🏥', '🏋', '🛍️', '🍷',
  '🧾', '🔑', '🏡', '🚿', '🧹', '📦', '🧺', '🎨', '✂️', '🖥️',
]

interface Props {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = ICONS.filter((i) => i.includes(search) || search === '')

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
        px={3}
        py={2}
        borderRadius="md"
        border="1px solid"
        borderColor={open ? 'brand.500' : '#2d2d35'}
        bg="#18181d"
        color="white"
        fontSize="xl"
        cursor="pointer"
        minW="10"
        _hover={{ borderColor: '#3a3a42' }}
        transition="border-color 0.15s"
      >
        {value || '🏷️'}
      </StyledButton>

      {open && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          zIndex={50}
          bg="#1a1a23"
          borderRadius="lg"
          border="1px solid"
          borderColor="#2d2d35"
          boxShadow="lg"
          p={3}
          w="72"
        >
          <Input
            size="sm"
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb={2}
            autoFocus
            bg="#18181d"
            borderColor="#2d2d35"
            color="white"
          />
          <Box maxH="40" overflowY="auto">
            <SimpleGrid columns={8} gap={1}>
              {filtered.map((icon) => (
                <StyledButton
                  key={icon}
                  type="button"
                  onClick={() => {
                    onChange(icon)
                    setOpen(false)
                  }}
                  p={1}
                  borderRadius="md"
                  fontSize="xl"
                  cursor="pointer"
                  bg={value === icon ? '#4F46E5' : 'transparent'}
                  _hover={{ bg: '#2d2d35' }}
                  textAlign="center"
                >
                  <Text>{icon}</Text>
                </StyledButton>
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      )}
    </Box>
  )
}
