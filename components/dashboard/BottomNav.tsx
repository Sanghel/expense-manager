'use client'

import { Box, Flex, Text, Icon } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  FiHome,
  FiDollarSign,
  FiRepeat,
  FiTarget,
  FiTrendingUp,
} from 'react-icons/fi'
import { IconType } from 'react-icons'

const primaryItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/transactions', label: 'Transacciones', icon: FiDollarSign },
  { href: '/savings-goals', label: 'Metas', icon: FiTarget },
  { href: '/recurring-transactions', label: 'Recurrentes', icon: FiRepeat },
  { href: '/budgets', label: 'Presupuestos', icon: FiTrendingUp },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={200}
      bg="#18181d"
      borderTopWidth="1px"
      borderColor="#2d2d35"
      display={{ base: 'block', md: 'none' }}
    >
      <Flex>
        {primaryItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{ flex: 1 }}>
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={2}
                gap="2px"
                color={isActive ? '#6366F1' : '#6b7280'}
                _hover={{ color: '#818cf8' }}
                transition="color 0.15s ease"
              >
                <Icon as={item.icon} boxSize={5} />
                <Text
                  fontSize="10px"
                  fontWeight={isActive ? '600' : '400'}
                  lineHeight="1"
                >
                  {item.label}
                </Text>
              </Flex>
            </Link>
          )
        })}
      </Flex>
    </Box>
  )
}
