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
        borderColor={open ? 'brand.500' : 'gray.200'}
        bg="white"
        fontSize="xl"
        cursor="pointer"
        minW="10"
        _hover={{ borderColor: 'gray.400' }}
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
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
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
                  bg={value === icon ? 'brand.100' : 'transparent'}
                  _hover={{ bg: 'gray.100' }}
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
