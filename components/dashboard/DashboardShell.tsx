'use client'

import { useState } from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <Flex direction="column" h="100vh" bg="#0f0f13">
      <Header onMenuOpen={() => setMobileNavOpen(true)} />
      <Flex flex="1" overflow="hidden" bg="#0f0f13">
        <Sidebar />
        <Box
          as="main"
          flex="1"
          overflow="auto"
          p={{ base: 4, md: 6, lg: 8 }}
          bg="#0f0f13"
        >
          {children}
        </Box>
      </Flex>
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </Flex>
  )
}
