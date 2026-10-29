'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Reads the URL search params and updates them with `history.pushState`.
 * Next keeps `useSearchParams` in sync with pushState, so the UI updates
 * without a server round trip and back/forward still work.
 */
export function useUrlParams() {
  const searchParams = useSearchParams()

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      const qs = next.toString()
      window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname)
    },
    [searchParams]
  )

  return { searchParams, setParams }
}
