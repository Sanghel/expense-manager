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

const TOAST_COLOR: Record<string, string> = {
  success: 'pos',
  error: 'neg',
  warning: 'warn',
  info: 'brand',
  loading: 'text2',
}

export function ChakraProvider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraUIProvider value={system}>
        {/* Dark by default; light is opt-in from Ajustes → Apariencia. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          // The inline script only matters in the server HTML (it sets the
          // theme before paint). On the client React 19 warns about rendering
          // an executable <script>, so it is marked inert there.
          scriptProps={typeof window === 'undefined' ? undefined : { type: 'application/json' }}
        >
          {children}
        </ThemeProvider>
        <DialogOverlayGuard />
        <Toaster toaster={toaster}>
          {(toast) => (
            <Toast.Root
              key={toast.id}
              w="auto"
              minW={{ base: 'calc(100vw - 32px)', sm: '320px' }}
              maxW="min(480px, calc(100vw - 32px))"
              bg="surface2"
              color="text"
              borderWidth="1px"
              borderColor="line"
              borderRadius="tile"
              ps={4}
              pe={2}
              py={2.5}
              gap={3}
              alignItems="center"
              boxShadow="overlay"
            >
              <Toast.Indicator flexShrink={0} color={TOAST_COLOR[toast.type ?? 'info'] ?? 'brand'} />
              <Box flex="1" minW="0" py={0.5}>
                <Text fontWeight="medium" fontSize="sm" lineHeight="1.35">
                  {toast.title as string}
                </Text>
                {toast.description && (
                  <Text fontSize="xs" color="text2" mt={0.5}>
                    {toast.description as string}
                  </Text>
                )}
              </Box>
              {/* In the flex flow (the recipe makes it absolute) so it never covers the text. */}
              <Toast.CloseTrigger
                position="static"
                flexShrink={0}
                alignSelf="center"
                color="text3"
                borderRadius="pill"
                _hover={{ color: 'text', bg: 'surface' }}
              />
            </Toast.Root>
          )}
        </Toaster>
      </ChakraUIProvider>
    </EmotionRegistry>
  )
}
