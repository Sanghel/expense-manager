'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import type { ThemePreference } from '@/types/database.types'

/**
 * Applies the theme saved in the user's profile. next-themes keeps the last
 * choice in localStorage, so this only changes something on a new device or
 * after the theme was changed elsewhere.
 */
export function ThemeSync({ theme }: { theme: ThemePreference | null }) {
  const { theme: current, setTheme } = useTheme()

  useEffect(() => {
    if (theme && theme !== current) setTheme(theme)
    // Only on mount / when the saved preference changes; local changes win.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  return null
}
