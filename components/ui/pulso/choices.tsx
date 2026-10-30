'use client'

import { Box, Button, Flex, Grid, Icon, Text, type ButtonProps } from '@chakra-ui/react'
import type { IconType } from 'react-icons'
import { formatCurrency } from '@/lib/utils/currency'
import { decimalsFor } from '@/lib/utils/amount-input'
import type { Account } from '@/types/database.types'

const ACTIVE_RING = 'inset 0 0 0 1.5px var(--chakra-colors-brand)'

export interface SegmentOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: IconType
  /** Colored active state (Gasto/Ingreso) instead of the neutral one. */
  tone?: 'pos' | 'neg'
}

/**
 * Pill segmented control (replaces radios). `default`: `bg` track, active
 * option `surface2`. `field`: 44px `surface2` track, active `surface`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = 'default',
  fullWidth = false,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  variant?: 'default' | 'field'
  fullWidth?: boolean
}) {
  const field = variant === 'field'
  return (
    <Flex
      role="radiogroup"
      aria-label={label}
      bg={field ? 'surface2' : 'bg'}
      borderRadius="pill"
      p="3px"
      gap="2px"
      h={field ? '44px' : 'auto'}
      w={fullWidth ? 'full' : 'fit-content'}
      maxW="full"
    >
      {options.map((o) => {
        const active = o.value === value
        const activeBg = o.tone ? `${o.tone}Soft` : field ? 'surface' : 'surface2'
        const activeFg = o.tone ?? 'text'
        return (
          <Button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            h={field ? 'full' : '34px'}
            flex={fullWidth ? '1' : undefined}
            minW={0}
            px={3.5}
            gap={1.5}
            fontSize="13px"
            fontWeight="500"
            bg={active ? activeBg : 'transparent'}
            color={active ? activeFg : 'text3'}
            boxShadow={active && !o.tone ? '0 1px 3px rgba(0,0,0,.2)' : 'none'}
            _hover={{ color: active ? activeFg : 'text' }}
          >
            {o.icon && <Icon as={o.icon} boxSize="15px" />}
            {o.label}
          </Button>
        )
      })}
    </Flex>
  )
}

/** Pill chip: `surface2`, selected `brandSoft` with a `brand` ring. */
export function Chip({ selected, children, ...props }: { selected: boolean } & ButtonProps) {
  return (
    <Button
      aria-pressed={selected}
      h="36px"
      px={3.5}
      gap={1.5}
      fontSize="13px"
      fontWeight="500"
      bg={selected ? 'brandSoft' : 'surface2'}
      color={selected ? 'text' : 'text2'}
      boxShadow={selected ? ACTIVE_RING : 'none'}
      _hover={{ bg: selected ? 'brandSoft' : 'line', color: 'text' }}
      {...props}
    >
      {children}
    </Button>
  )
}

export interface ChipOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
}

/** Single-select chip row (replaces category / type selects). */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  children,
}: {
  options: ChipOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** Extra controls after the chips ("Ver todas", "+ Nueva"). */
  children?: React.ReactNode
}) {
  return (
    <Flex wrap="wrap" gap={2}>
      {options.map((o) => (
        <Chip key={o.value} selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon && <span>{o.icon}</span>}
          {o.label}
        </Chip>
      ))}
      {children}
    </Flex>
  )
}

/** First account option: "∅ Sin cuenta", "⭐ Cuenta por defecto"… */
export interface LeadingAccountOption {
  value: string
  label: string
  hint: string
}

/**
 * Account cards (name + mono balance) in a horizontally scrolling row.
 * `value` is an account id or the leading option's value.
 */
export function AccountChips({
  accounts,
  value,
  onChange,
  leading,
}: {
  accounts: Pick<Account, 'id' | 'name' | 'icon' | 'balance' | 'currency'>[]
  value: string
  onChange: (value: string) => void
  leading?: LeadingAccountOption
}) {
  const cards = [
    ...(leading ? [{ id: leading.value, title: leading.label, sub: leading.hint, negative: false }] : []),
    ...accounts.map((a) => ({
      id: a.id,
      title: `${a.icon ? `${a.icon} ` : ''}${a.name}`,
      sub: formatCurrency(a.balance ?? 0, a.currency, decimalsFor(a.currency)),
      negative: (a.balance ?? 0) < 0,
    })),
  ]

  return (
    <Flex
      gap={2}
      overflowX="auto"
      pb={2}
      css={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--chakra-colors-track) transparent',
      }}
    >
      {cards.map((c) => {
        const selected = c.id === value
        return (
          <Button
            key={c.id || 'none'}
            aria-pressed={selected}
            onClick={() => onChange(c.id)}
            h="auto"
            py="10px"
            px="14px"
            borderRadius="16px"
            flexShrink={0}
            flexDirection="column"
            alignItems="flex-start"
            gap={0.5}
            bg={selected ? 'brandSoft' : 'surface2'}
            color="text"
            boxShadow={selected ? ACTIVE_RING : 'none'}
            _hover={{ bg: selected ? 'brandSoft' : 'line' }}
          >
            <Text as="span" fontSize="13px" fontWeight="500">
              {c.title}
            </Text>
            <Text as="span" fontFamily="mono" fontSize="11px" color={c.negative ? 'neg' : 'text3'}>
              {c.sub}
            </Text>
          </Button>
        )
      })}
    </Flex>
  )
}

/** Swatches from the Pulso handoff. */
export const SWATCHES = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6', '#64748B']

/** Round color swatches; the selected one gets a double ring. */
export function ColorSwatches({
  value,
  onChange,
  colors = SWATCHES,
}: {
  value: string
  onChange: (color: string) => void
  colors?: string[]
}) {
  // The stored value may be lowercase or a color outside the list.
  const list = colors.some((c) => c.toLowerCase() === value.toLowerCase()) || !value ? colors : [...colors, value]
  return (
    <Flex wrap="wrap" gap={3} role="radiogroup" aria-label="Color">
      {list.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase()
        return (
          <Box
            as="button"
            key={c}
            role="radio"
            aria-checked={selected}
            aria-label={c}
            onClick={() => onChange(c.toLowerCase())}
            boxSize="28px"
            borderRadius="full"
            bg={c}
            cursor="pointer"
            boxShadow={selected ? `0 0 0 2px var(--chakra-colors-surface), 0 0 0 4px ${c}` : 'none'}
          />
        )
      })}
    </Flex>
  )
}

/** Emoji grid (40px tiles); the selected one looks like an active chip. */
export function EmojiGrid({
  value,
  onChange,
  emojis,
}: {
  value: string
  onChange: (emoji: string) => void
  emojis: string[]
}) {
  return (
    <Grid templateColumns="repeat(auto-fill, minmax(40px, 1fr))" gap={2} role="radiogroup" aria-label="Ícono">
      {emojis.map((e) => {
        const selected = e === value
        return (
          <Button
            key={e}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(e)}
            h="40px"
            minW="40px"
            p={0}
            borderRadius="12px"
            fontSize="18px"
            bg={selected ? 'brandSoft' : 'surface2'}
            boxShadow={selected ? ACTIVE_RING : 'none'}
            _hover={{ bg: selected ? 'brandSoft' : 'line' }}
          >
            {e}
          </Button>
        )
      })}
    </Grid>
  )
}
