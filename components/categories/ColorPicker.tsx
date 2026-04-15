'use client'

import { SimpleGrid, Popover, chakra } from '@chakra-ui/react'

const StyledButton = chakra('button')

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#64748b', '#78716c', '#84cc16', '#06b6d4', '#a855f7',
]

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <StyledButton
          type="button"
          w="9"
          h="9"
          borderRadius="md"
          bg={value}
          border="2px solid"
          borderColor="gray.300"
          cursor="pointer"
          _hover={{ borderColor: 'gray.500' }}
        />
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content w="44">
          <Popover.Body p={3}>
            <SimpleGrid columns={5} gap={2}>
              {COLORS.map((color) => (
                <StyledButton
                  key={color}
                  type="button"
                  onClick={() => onChange(color)}
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
            </SimpleGrid>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  )
}
