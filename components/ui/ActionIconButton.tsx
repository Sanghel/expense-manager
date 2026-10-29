'use client'

import { IconButton, Portal, Tooltip, type IconButtonProps } from '@chakra-ui/react'
import type { IconType } from 'react-icons'
import { ACTION_ICONS, type ActionKind } from './action-icons'

type Tone = 'neutral' | 'danger' | 'primary'

/** Chakra style props passed through for the few buttons with a distinctive look. */
type StyleProps = Omit<
  IconButtonProps,
  'aria-label' | 'children' | 'size' | 'variant' | 'onClick' | 'type' | 'loading' | 'disabled'
>

interface Props extends StyleProps {
  kind: ActionKind
  /** Spanish name of the action: used as aria-label and tooltip text. */
  label: string
  onClick?: () => void
  /** Defaults to 'button' so it never submits a surrounding form by accident. */
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  /** neutral = grey ghost, danger = red, primary = solid brand (e.g. send). */
  tone?: Tone
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'outline' | 'subtle' | 'solid'
  /** Exceptional override; prefer adding the action to ACTION_ICONS. */
  icon?: IconType
}

// The primary tone sets its colors explicitly so it matches PrimaryButton.
const TONE_STYLES: Record<Tone, Pick<IconButtonProps, 'colorPalette' | 'color' | 'bg' | '_hover'>> = {
  neutral: { colorPalette: 'gray', color: 'text2', _hover: { color: 'text' } },
  danger: { colorPalette: 'red', color: 'neg', _hover: { color: 'neg', bg: 'negSoft' } },
  primary: { color: 'white', bg: 'brandSolid', _hover: { bg: 'brand.600' } },
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
  type = 'button',
  loading,
  disabled,
  tone = 'neutral',
  size = 'sm',
  variant,
  icon,
  ...styleProps
}: Props) {
  const Icon = icon ?? ACTION_ICONS[kind]

  return (
    <Tooltip.Root openDelay={300} closeDelay={100}>
      <Tooltip.Trigger asChild>
        <IconButton
          aria-label={label}
          size={size}
          variant={variant ?? (tone === 'primary' ? 'solid' : 'ghost')}
          {...TONE_STYLES[tone]}
          loading={loading}
          disabled={disabled || loading}
          onClick={onClick}
          type={type}
          flexShrink={0}
          // 44px touch target below md; above it the size recipe applies.
          minW={{ mdDown: '11' }}
          minH={{ mdDown: '11' }}
          {...styleProps}
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
