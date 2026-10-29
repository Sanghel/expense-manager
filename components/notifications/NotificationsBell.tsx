'use client'

import { useState } from 'react'
import {
  Button,
  Circle,
  PopoverRoot,
  PopoverTrigger,
  PopoverPositioner,
  PopoverContent,
  Icon,
} from '@chakra-ui/react'
import { LuBell } from 'react-icons/lu'
import { NotificationsPanel } from './NotificationsPanel'
import {
  countActionable,
  type ReminderOccurrence,
} from '@/lib/reminders/pending'
import type { Account } from '@/types/database.types'

interface Props {
  userId: string
  accounts: Account[]
  occurrences: ReminderOccurrence[]
}

export function NotificationsBell({ userId, accounts, occurrences }: Props) {
  const [open, setOpen] = useState(false)
  const badge = countActionable(occurrences)

  return (
    <PopoverRoot
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: 'bottom-end' }}
    >
      <PopoverTrigger asChild>
        <Button
          position="relative"
          p={0}
          minW="auto"
          w={{ base: '36px', md: '40px' }}
          h={{ base: '36px', md: '40px' }}
          flexShrink={0}
          bg="surface"
          color={badge > 0 ? 'text' : 'text2'}
          _hover={{ bg: 'surface2' }}
          aria-label={
            badge > 0 ? `Notificaciones, ${badge} pendientes` : 'Notificaciones'
          }
        >
          <Icon as={LuBell} boxSize="17px" />
          {badge > 0 && (
            <Circle size="7px" bg="neg" position="absolute" top="9px" right="10px" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverPositioner>
        <PopoverContent
          bg="surface"
          borderRadius="tile"
          boxShadow="overlay"
          w={{ base: 'calc(100vw - 32px)', sm: '380px' }}
          maxW="380px"
        >
          <NotificationsPanel
            userId={userId}
            accounts={accounts}
            occurrences={occurrences}
            onClosePanel={() => setOpen(false)}
          />
        </PopoverContent>
      </PopoverPositioner>
    </PopoverRoot>
  )
}
