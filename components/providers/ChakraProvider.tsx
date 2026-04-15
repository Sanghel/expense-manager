'use client'

import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react'
import { system } from '@/theme'
import { ReactNode } from 'react'

export function ChakraProvider({ children }: { children: ReactNode }) {
  return <ChakraUIProvider value={system}>{children}</ChakraUIProvider>
}
