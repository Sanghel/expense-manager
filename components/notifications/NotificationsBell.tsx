'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Float,
  Circle,
  PopoverRoot,
  PopoverTrigger,
  PopoverPositioner,
  PopoverContent,
  Icon,
} from '@chakra-ui/react'
import { FiBell } from 'react-icons/fi'
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
          variant="ghost"
          rounded="full"
          p={0}
          minW="auto"
          h="auto"
          aria-label={
            badge > 0 ? `Notificaciones, ${badge} pendientes` : 'Notificaciones'
          }
        >
          <Box position="relative" p={2}>
            <Icon
              as={FiBell}
              boxSize={5}
              color={badge > 0 ? 'white' : '#B0B0B0'}
            />
            {badge > 0 && (
              <Float placement="top-end" offset="2">
                <Circle
                  size="4"
                  bg="#F43F5E"
                  color="white"
                  fontSize="10px"
                  fontWeight="bold"
                >
                  {badge > 9 ? '9+' : badge}
                </Circle>
              </Float>
            )}
          </Box>
        </Button>
      </PopoverTrigger>

      <PopoverPositioner>
        <PopoverContent
          bg="#18181d"
          borderColor="#2d2d35"
          borderWidth="1px"
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
