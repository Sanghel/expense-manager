'use client'

import { useTheme } from 'next-themes'
import type { ThemePreference } from '@/types/database.types'

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme()
  const colorMode: ThemePreference = resolvedTheme === 'light' ? 'light' : 'dark'

  return {
    colorMode,
    setColorMode: (mode: ThemePreference) => setTheme(mode),
    toggleColorMode: () => setTheme(colorMode === 'dark' ? 'light' : 'dark'),
  }
}
