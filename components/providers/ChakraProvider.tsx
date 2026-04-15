'use client'

import { ChakraProvider as ChakraUIProvider, Toaster, Toast, HStack, Box } from '@chakra-ui/react'
import { system } from '@/theme'
import { ReactNode } from 'react'
import { toaster } from '@/lib/toaster'
import { EmotionRegistry } from './EmotionRegistry'

export function ChakraProvider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraUIProvider value={system}>
        {children}
        <Toaster toaster={toaster}>
          {(toast) => (
            <Toast.Root key={toast.id}>
              <HStack gap={3} flex="1">
                <Toast.Indicator />
                <Box flex="1">
                  <Toast.Title>{toast.title as string}</Toast.Title>
                  {toast.description && (
                    <Toast.Description>{toast.description as string}</Toast.Description>
                  )}
                </Box>
                <Toast.CloseTrigger />
              </HStack>
            </Toast.Root>
          )}
        </Toaster>
      </ChakraUIProvider>
    </EmotionRegistry>
  )
}
