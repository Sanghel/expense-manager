'use client'

import { Button, Flex } from '@chakra-ui/react'
import { LuMoon, LuSun } from 'react-icons/lu'
import { useSyncExternalStore } from 'react'
import { useColorMode } from '@/hooks/useColorMode'
import { updateTheme } from '@/lib/actions/users.actions'
import { toaster } from '@/lib/toaster'
import type { ThemePreference } from '@/types/database.types'

const MODES: { value: ThemePreference; label: string; icon: typeof LuMoon }[] = [
  { value: 'dark', label: 'Oscuro', icon: LuMoon },
  { value: 'light', label: 'Claro', icon: LuSun },
]

const noopSubscribe = () => () => {}

/**
 * Dark / light switch. Applies instantly (next-themes) and saves it to the
 * profile so other devices follow.
 */
export function AppearanceSelector({ userId }: { userId: string }) {
  const { colorMode, setColorMode } = useColorMode()
  // The theme is only known on the client; render neutral until mounted.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  const choose = async (mode: ThemePreference) => {
    if (mode === colorMode) return
    const previous = colorMode
    setColorMode(mode)
    const result = await updateTheme(userId, mode)
    if (!result.success) {
      setColorMode(previous)
      toaster.create({ title: 'No se pudo guardar el tema', description: result.error, type: 'error', duration: 4000 })
    }
  }

  return (
    <Flex gap={2} role="radiogroup" aria-label="Apariencia">
      {MODES.map((m) => {
        const active = mounted && m.value === colorMode
        return (
          <Button
            key={m.value}
            role="radio"
            aria-checked={active}
            onClick={() => choose(m.value)}
            h="36px"
            px={4}
            gap={2}
            bg={active ? 'text' : 'transparent'}
            color={active ? 'bg' : 'text2'}
            boxShadow={active ? 'none' : 'inset 0 0 0 1px var(--chakra-colors-line)'}
            _hover={active ? undefined : { bg: 'surface2', color: 'text' }}
          >
            <m.icon />
            {m.label}
          </Button>
        )
      })}
    </Flex>
  )
}
