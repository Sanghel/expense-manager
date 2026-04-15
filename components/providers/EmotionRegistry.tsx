'use client'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { useServerInsertedHTML } from 'next/navigation'
import { useState } from 'react'

/**
 * Collects emotion styles during SSR and injects them into <head>
 * via useServerInsertedHTML, so server and client render the same structure.
 * Required for Next.js App Router + emotion (Chakra UI v3) hydration consistency.
 */
export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'css' })
    cache.compat = true

    const prevInsert = cache.insert.bind(cache)
    let inserted: string[] = []

    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const [, serialized] = args
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return prevInsert(...args)
    }

    const flush = () => {
      const prev = inserted
      inserted = []
      return prev
    }

    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (names.length === 0) return null

    let styles = ''
    for (const name of names) {
      styles += cache.inserted[name] ?? ''
    }

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}
