'use client'

import { useState, useEffect } from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileNav } from './MobileNav'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <Flex direction="row" h="100dvh" bg="#0f0f13">
      <Sidebar isCollapsed={isCollapsed} toggle={toggleSidebar} />
      <Flex direction="column" flex="1" minW={0} overflow="hidden" bg="#0f0f13">
        <Header isCollapsed={isCollapsed} />
        <Box
          as="main"
          flex="1"
          overflow="auto"
          p={{ base: 4, md: 6, lg: 8 }}
          pb={{ base: 'calc(84px + env(safe-area-inset-bottom))', md: 6, lg: 8 }}
          bg="#0f0f13"
        >
          {children}
        </Box>
      </Flex>
      <BottomNav onMoreClick={() => setIsMobileNavOpen(true)} />
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </Flex>
  )
}
