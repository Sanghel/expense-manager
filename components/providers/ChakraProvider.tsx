'use client'

import {
  ChakraProvider as ChakraUIProvider,
  Toaster,
  Toast,
  Box,
  Text,
} from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'
import { system } from '@/theme'
import { ReactNode, useEffect } from 'react'
import { toaster } from '@/lib/toaster'
import { EmotionRegistry } from './EmotionRegistry'

function DialogOverlayGuard() {
  useEffect(() => {
    // Zag's disablePointerEventsOutside sets body.style.pointerEvents="none" when a
    // modal opens and restores it only if layerStack.hasPointerBlockingLayer() === false.
    // Two failure scenarios leave the body frozen:
    //
    // 1. layerStack node reference becomes null before cleanup runs (e.g. parent unmounts
    //    the dialog component simultaneously with isOpen→false; layerStack.remove(null)
    //    short-circuits, the layer stays in the stack, cleanup skips body restoration).
    //
    // 2. React dev-mode double-effects leave a ghost layer in the stack.
    //
    // Polling every 150ms is cheap (one querySelector per tick) and catches any stuck
    // state regardless of how it was triggered, without false positives — we only clear
    // when no dialog is visually open.
    const body = document.body

    const clearIfStuck = () => {
      if (body.style.pointerEvents !== 'none') return
      const hasOpenDialog = !!document.querySelector('[data-scope="dialog"][data-state="open"]')
      if (hasOpenDialog) return
      body.style.pointerEvents = ''
      body.removeAttribute('data-inert')
      if (body.style.length === 0) body.removeAttribute('style')
    }

    const id = setInterval(clearIfStuck, 150)
    return () => clearInterval(id)
  }, [])

  return null
}

export function ChakraProvider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraUIProvider value={system}>
        {/* Dark by default; light is opt-in from Ajustes → Apariencia. */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <DialogOverlayGuard />
        <Toaster toaster={toaster}>
          {(toast) => (
            <Toast.Root
              key={toast.id}
              w="auto"
              maxW="min(480px, calc(100vw - 32px))"
              bg="text"
              color="bg"
              borderRadius="pill"
              px={5}
              py={3}
              alignItems="center"
              boxShadow="overlay"
            >
              <Toast.Indicator color={toast.type === 'error' ? 'neg' : 'pos'} />
              <Box flex="1" minW="0">
                <Text fontWeight="medium" fontSize="sm">
                  {toast.title as string}
                </Text>
                {toast.description && (
                  <Text fontSize="xs" opacity={0.7}>
                    {toast.description as string}
                  </Text>
                )}
              </Box>
              <Toast.CloseTrigger color="bg" />
            </Toast.Root>
          )}
        </Toaster>
      </ChakraUIProvider>
    </EmotionRegistry>
  )
}
