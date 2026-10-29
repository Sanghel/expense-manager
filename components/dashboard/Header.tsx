'use client'

import {
  Box,
  Flex,
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
  MenuContent,
  MenuItem,
  Button,
  Circle,
  Icon,
  Text,
} from '@chakra-ui/react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LuLightbulb, LuLogOut, LuSettings, LuSparkles } from 'react-icons/lu'
import logo from '@/public/brand/gh_push_money_logo.png'
import { NotificationsBell } from '@/components/notifications/NotificationsBell'
import { NAV_ITEMS, isNavItemActive } from './nav-items'
import { openAiChat } from '@/lib/ai-chat'
import type { ReminderOccurrence } from '@/lib/reminders/pending'
import type { Account } from '@/types/database.types'

interface Props {
  userId: string | null
  accounts: Account[]
  notifications: ReminderOccurrence[]
}

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')
}

/** Desktop icon nav: inactive items show only the icon, the active one adds its label. */
function IconNav() {
  const pathname = usePathname()

  return (
    <Flex as="nav" aria-label="Principal" gap={1} flexShrink={0} display={{ base: 'none', md: 'flex' }}>
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href)
        return (
          <Flex
            key={item.href}
            asChild
            align="center"
            gap={2}
            h="38px"
            ps={active ? '12px' : '11px'}
            pe={active ? '14px' : '11px'}
            borderRadius="nav"
            bg={active ? 'brandSoft' : 'transparent'}
            color={active ? 'brand' : 'text2'}
            fontSize="14px"
            fontWeight="500"
            whiteSpace="nowrap"
            transition="background 150ms, color 150ms"
            _hover={active ? undefined : { bg: 'surface2', color: 'text' }}
          >
            <NextLink
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              title={active ? undefined : item.label}
            >
              <Icon as={item.icon} boxSize="17px" />
              {active && item.label}
            </NextLink>
          </Flex>
        )
      })}
    </Flex>
  )
}

/** Main entry point to the AI: opens the chat (also ⌘K / Ctrl+K). */
function AiBar() {
  return (
    <Button
      onClick={openAiChat}
      aria-label="Registrar con IA"
      flex="1 1 0"
      minW="40px"
      maxW="380px"
      ms="auto"
      overflow="hidden"
      h="40px"
      px={{ base: 3, md: 4 }}
      gap={2.5}
      justifyContent="flex-start"
      bg="surface"
      color="text3"
      fontWeight="400"
      fontSize="14px"
      _hover={{ bg: 'surface2' }}
    >
      <Icon as={LuSparkles} boxSize="16px" color="brand" flexShrink={0} />
      <Text as="span" flex="1" minW={0} textAlign="start" truncate>
        Registra un gasto: “almuerzo 32 mil”
      </Text>
      <Text
        as="span"
        display={{ base: 'none', md: 'inline' }}
        fontFamily="mono"
        fontSize="11px"
        bg="surface2"
        color="text2"
        px={2}
        py={0.5}
        borderRadius="md"
        flexShrink={0}
      >
        ⌘K
      </Text>
    </Button>
  )
}

export function Header({ userId, accounts, notifications }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      bg="bg"
      borderBottomWidth="1px"
      borderColor="line"
      px={{ base: 4, md: 7 }}
      py="14px"
      flexShrink={0}
      style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}
    >
      <Flex align="center" gap={{ base: 3, md: 5 }}>
        <Flex asChild align="center" gap={2.5} flexShrink={0}>
          <NextLink href="/dashboard" aria-label="GitPush Money, ir al resumen">
            <Image src={logo} alt="" width={28} height={28} />
            <Text
              as="span"
              display={{ base: 'none', lg: 'inline' }}
              fontSize="15px"
              fontWeight="600"
              color="text"
              whiteSpace="nowrap"
            >
              GitPush Money
            </Text>
          </NextLink>
        </Flex>

        <IconNav />
        <AiBar />

        {userId && (
          <NotificationsBell userId={userId} accounts={accounts} occurrences={notifications} />
        )}

        {/* The design hides the avatar on mobile; it stays because it is the
            only way to reach "Cerrar sesión" and "Consejos de ahorro" there. */}
        {session?.user && (
          <MenuRoot positioning={{ placement: 'bottom-end' }}>
            <MenuTrigger asChild>
              <Button
                aria-label="Menú de usuario"
                variant="ghost"
                p={0}
                minW="auto"
                w={{ base: '36px', md: '40px' }}
                h={{ base: '36px', md: '40px' }}
                flexShrink={0}
              >
                <Circle size="full" bg="brandSoft" color="brand" fontSize="13px" fontWeight="600">
                  {initials(session.user.name).toUpperCase()}
                </Circle>
              </Button>
            </MenuTrigger>
            <MenuPositioner>
              <MenuContent minW="48" bg="surface" borderRadius="tile" boxShadow="overlay">
                <MenuItem value="settings" onClick={() => router.push('/settings')}>
                  <LuSettings />
                  Ajustes
                </MenuItem>
                <MenuItem value="tips" onClick={() => router.push('/consejos-ahorro')}>
                  <LuLightbulb />
                  Consejos de ahorro
                </MenuItem>
                <MenuItem value="logout" color="neg" onClick={() => signOut()}>
                  <LuLogOut />
                  Cerrar sesión
                </MenuItem>
              </MenuContent>
            </MenuPositioner>
          </MenuRoot>
        )}
      </Flex>
    </Box>
  )
}
