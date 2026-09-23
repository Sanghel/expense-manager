'use client'

import { Portal, Text, Tooltip, type TextProps } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'

interface Props extends Omit<TextProps, 'children'> {
  children: string
}

/**
 * Single-line text truncated with "…". Only when the text actually overflows
 * it shows the full text in a tooltip, reachable by hover, keyboard focus and
 * tap (spec FR-001/FR-002). The flex parent must allow shrinking (minW={0}).
 */
export function TruncatedText({ children, ...textProps }: Props) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
    // `overflowing` remounts the element (plain text ↔ tooltip trigger), so re-observe it.
  }, [children, overflowing])

  // Tap-opened tooltips have no hover to close them: close on any outside press.
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const text = (
    <Text ref={ref} truncate minW={0} {...textProps}>
      {children}
    </Text>
  )

  if (!overflowing) return text

  return (
    <Tooltip.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      openDelay={300}
      closeOnPointerDown={false}
      closeOnClick={false}
    >
      <Tooltip.Trigger asChild>
        <Text
          ref={ref}
          truncate
          minW={0}
          tabIndex={0}
          cursor="default"
          onClick={() => setOpen(true)}
          {...textProps}
        >
          {children}
        </Text>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content maxW="xs">{children}</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}
