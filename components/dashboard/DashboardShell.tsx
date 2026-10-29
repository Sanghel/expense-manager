'use client'

import { Box, Flex } from '@chakra-ui/react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { CraftedByFooter } from './CraftedByFooter'
import type { ReminderOccurrence } from '@/lib/reminders/pending'
import type { Account } from '@/types/database.types'

interface Props {
  children: React.ReactNode
  userId: string | null
  accounts: Account[]
  notifications: ReminderOccurrence[]
}

export function DashboardShell({ children, userId, accounts, notifications }: Props) {
  return (
    <Flex direction="column" minH="100dvh" bg="bg">
      <Header userId={userId} accounts={accounts} notifications={notifications} />
      <Box
        as="main"
        flex="1"
        w="full"
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 10 }}
        pt={{ base: '22px', md: 10 }}
        pb={{ base: 'calc(110px + env(safe-area-inset-bottom))', md: '72px' }}
      >
        {children}
        <Box mt={12}>
          <CraftedByFooter />
        </Box>
      </Box>
      <BottomNav />
    </Flex>
  )
}
