'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useNavigation() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  const navigate = useCallback(
    (href: string) => {
      setLoadingPath(href)
      startTransition(() => {
        router.push(href)
      })
    },
    [router]
  )

  useEffect(() => {
    if (!isPending) {
      setLoadingPath(null)
    }
  }, [isPending])

  return { navigate, loadingPath }
}
