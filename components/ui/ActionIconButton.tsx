'use client'

import { IconButton, Portal, Tooltip } from '@chakra-ui/react'
import type { IconType } from 'react-icons'
import { ACTION_ICONS, type ActionKind } from './action-icons'

interface Props {
  kind: ActionKind
  /** Spanish name of the action: used as aria-label and tooltip text. */
  label: string
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  tone?: 'neutral' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  variant?: 'ghost' | 'outline' | 'subtle'
  /** Exceptional override; prefer adding the action to ACTION_ICONS. */
  icon?: IconType
}

/**
 * Icon-only button for utility actions. Always has an accessible name and a
 * tooltip on hover/keyboard focus. On touch, tapping runs the action and no
 * tooltip is shown (spec FR-007).
 */
export function ActionIconButton({
  kind,
  label,
  onClick,
  loading,
  disabled,
  tone = 'neutral',
  size = 'sm',
  variant = 'ghost',
  icon,
}: Props) {
  const Icon = icon ?? ACTION_ICONS[kind]

  return (
    <Tooltip.Root openDelay={300} closeDelay={100}>
      <Tooltip.Trigger asChild>
        <IconButton
          aria-label={label}
          size={size}
          variant={variant}
          colorPalette={tone === 'danger' ? 'red' : 'gray'}
          color={tone === 'danger' ? 'red.400' : 'text.secondary'}
          _hover={{ color: tone === 'danger' ? 'red.300' : 'text.primary' }}
          loading={loading}
          disabled={disabled || loading}
          onClick={onClick}
          minW={{ base: '11', md: 'auto' }}
          minH={{ base: '11', md: 'auto' }}
        >
          <Icon />
        </IconButton>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>{label}</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}
