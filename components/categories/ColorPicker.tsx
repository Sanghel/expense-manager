'use client'

import { ColorPicker as ChakraColorPicker, HStack, Text, parseColor } from '@chakra-ui/react'
import { FloatingPortal } from '@/components/ui/FloatingPortal'
import { useState } from 'react'

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

const FALLBACK = '#6366f1'

type Color = ReturnType<typeof parseColor>

/** Stored format: `#rrggbb` lowercase, no alpha (same as before). */
const toHex = (color: Color) => color.toString('hex').toLowerCase()

function safeParse(value: string): Color {
  try {
    return parseColor(value || FALLBACK)
  } catch {
    return parseColor(FALLBACK)
  }
}

interface Props {
  value: string
  onChange: (color: string) => void
}

/**
 * Color picker on Chakra's ColorPicker: the 15 preset swatches plus a custom
 * area, hue slider and hex field. Never opens the OS color dialog.
 */
export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  // Keep the full color (hue included) locally: round-tripping through hex
  // loses the hue on greys/black and would make the area thumb jump.
  const [color, setColor] = useState(() => safeParse(value))
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (value && value.toLowerCase() !== toHex(color)) setColor(safeParse(value))
  }

  return (
    <ChakraColorPicker.Root
      value={color}
      onValueChange={(e) => {
        setColor(e.value)
        const hex = toHex(e.value)
        if (hex !== value.toLowerCase()) onChange(hex)
      }}
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      format="rgba"
      colorPalette="brand"
      width="auto"
    >
      <ChakraColorPicker.HiddenInput />
      <ChakraColorPicker.Control>
        <ChakraColorPicker.Trigger aria-label="Elegir color" p="0" borderWidth="0" bg="transparent">
          <ChakraColorPicker.ValueSwatch
            boxSize="9"
            borderRadius="md"
            borderWidth="2px"
            borderColor={open ? 'brand.500' : 'border.default'}
            _hover={{ borderColor: 'brand.500' }}
          />
        </ChakraColorPicker.Trigger>
      </ChakraColorPicker.Control>
      <FloatingPortal>
        <ChakraColorPicker.Positioner>
          <ChakraColorPicker.Content w="220px" colorPalette="brand">
            <ChakraColorPicker.SwatchGroup display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
              {COLORS.map((c) => (
                <ChakraColorPicker.SwatchTrigger
                  key={c}
                  value={c}
                  aria-label={`Color ${c}`}
                  onClick={() => setOpen(false)}
                >
                  <ChakraColorPicker.Swatch value={c} boxSize="7" borderRadius="md">
                    <ChakraColorPicker.SwatchIndicator color="white" />
                  </ChakraColorPicker.Swatch>
                </ChakraColorPicker.SwatchTrigger>
              ))}
            </ChakraColorPicker.SwatchGroup>
            <Text fontSize="xs" color="text.secondary">
              Personalizado
            </Text>
            <ChakraColorPicker.Area />
            <ChakraColorPicker.ChannelSlider channel="hue" />
            <HStack>
              <ChakraColorPicker.ChannelInput channel="hex" aria-label="Color hexadecimal" textTransform="uppercase" />
            </HStack>
          </ChakraColorPicker.Content>
        </ChakraColorPicker.Positioner>
      </FloatingPortal>
    </ChakraColorPicker.Root>
  )
}
