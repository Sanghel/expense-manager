'use client'

import { SimpleGrid, Button, Text, Popover, Input, chakra } from '@chakra-ui/react'

const StyledButton = chakra('button')
import { useState } from 'react'

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
  const [search, setSearch] = useState('')

  const filtered = ICONS.filter((i) => i.includes(search))

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="outline" size="sm" minW="10">
          {value || '🏷️'}
        </Button>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content w="72">
          <Popover.Body p={3}>
            <Input
              size="sm"
              placeholder="Buscar emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              mb={2}
            />
            <SimpleGrid columns={8} gap={1}>
              {filtered.map((icon) => (
                <StyledButton
                  key={icon}
                  type="button"
                  onClick={() => onChange(icon)}
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
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  )
}
