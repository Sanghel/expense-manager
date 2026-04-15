'use client'

import { ChakraProvider as ChakraUIProvider, Toaster, Toast } from '@chakra-ui/react'
import { system } from '@/theme'
import { ReactNode } from 'react'
import { toaster } from '@/lib/toaster'

export function ChakraProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraUIProvider value={system}>
      {children}
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root key={toast.id}>
            <Toast.Indicator />
            <Toast.Title>{toast.title as string}</Toast.Title>
            {toast.description && (
              <Toast.Description>{toast.description as string}</Toast.Description>
            )}
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </Toaster>
    </ChakraUIProvider>
  )
}
