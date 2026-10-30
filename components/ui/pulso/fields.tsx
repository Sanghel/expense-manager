'use client'

import { Box, Flex, Icon, Input, Switch, Text, type InputProps } from '@chakra-ui/react'
import type { IconType } from 'react-icons'

/** Mono uppercase label (textStyle sectionLabel). "Opcional" goes in the label, no asterisks. */
export function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Text textStyle="sectionLabel" color="text3" mb={2.5}>
      {children}
      {optional && ' · opcional'}
    </Text>
  )
}

/** A labeled block of the form body. */
export function Field({
  label,
  optional,
  children,
}: {
  label: React.ReactNode
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <Box minW={0}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      {children}
    </Box>
  )
}

/** The main field as large text over a bottom line, no box (Recordatorio, Meta). */
export function TitleInput(props: InputProps) {
  return (
    <Input
      variant="flushed"
      h="auto"
      py={2}
      px={0}
      fontSize="22px"
      fontWeight="600"
      letterSpacing="-0.01em"
      color="text"
      borderBottomWidth="1px"
      borderColor="line"
      _focusVisible={{ borderColor: 'brand', boxShadow: 'none' }}
      _placeholder={{ color: 'text3' }}
      {...props}
    />
  )
}

/** Summary or help box: `brand` confirms an action, `neutral` informs. */
export function SummaryBox({
  icon,
  tone = 'neutral',
  children,
}: {
  icon?: IconType
  tone?: 'brand' | 'neutral'
  children: React.ReactNode
}) {
  return (
    <Flex
      gap={3}
      align="flex-start"
      bg={tone === 'brand' ? 'brandSoft' : 'surface2'}
      borderRadius="input"
      px={3.5}
      py={3}
      fontSize="13px"
      color="text"
    >
      {icon && <Icon as={icon} boxSize="16px" mt="2px" color={tone === 'brand' ? 'brand' : 'text3'} flexShrink={0} />}
      <Box minW={0} flex="1">
        {children}
      </Box>
    </Flex>
  )
}

/** Clickable row with a title, a description and a switch. */
export function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    // The whole row toggles; the switch ignores pointer events so a click
    // doesn't toggle twice (keyboard still works through its hidden input).
    <Flex
      align="center"
      justify="space-between"
      gap={3}
      bg="surface2"
      borderRadius="tile"
      px={4}
      py={3.5}
      cursor="pointer"
      onClick={() => onChange(!checked)}
    >
      <Box minW={0}>
        <Text fontSize="14px" fontWeight="500" color="text">
          {title}
        </Text>
        {description && (
          <Text fontSize="12px" color="text3" mt={0.5}>
            {description}
          </Text>
        )}
      </Box>
      <Switch.Root
        checked={checked}
        onCheckedChange={(e) => onChange(e.checked)}
        colorPalette="brand"
        pointerEvents="none"
        aria-label={title}
      >
        <Switch.HiddenInput />
        <Switch.Control w="44px" h="24px" bg={checked ? 'brandSolid' : 'track'}>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </Flex>
  )
}
