'use client'

import { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatInterface } from './ChatInterface'
import { OPEN_AI_CHAT_EVENT } from '@/lib/ai-chat'
import type { Account, Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  accounts?: Account[]
}

const MotionBox = motion.create(Box as React.ComponentType<React.ComponentProps<typeof Box>>)

export function FloatingChat({ userId, categories, accounts = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  // Opened from the header AI bar (event) or ⌘K / Ctrl+K; Esc closes it.
  useEffect(() => {
    const open = () => setIsOpen(true)
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener(OPEN_AI_CHAT_EVENT, open)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(OPEN_AI_CHAT_EVENT, open)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBox
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          position="fixed"
          zIndex={1000}
          bg="surface"
          borderRadius="card"
          boxShadow="overlay"
          overflow="hidden"
          /* Desktop */
          bottom={{ base: 'calc(100px + env(safe-area-inset-bottom))', md: '24px' }}
          right={{ base: '12px', md: '24px' }}
          left={{ base: '12px', md: 'auto' }}
          w={{ base: 'auto', md: '380px' }}
          h={{ base: 'calc(100dvh - 200px)', md: '520px' }}
          maxH={{ base: '560px', md: '520px' }}
        >
          <ChatInterface
            userId={userId}
            categories={categories}
            accounts={accounts}
            onClose={() => setIsOpen(false)}
          />
        </MotionBox>
      )}
    </AnimatePresence>
  )
}
