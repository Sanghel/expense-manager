'use client'

import { Box, VStack, Button, Icon } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  FiHome,
  FiDollarSign,
  FiTag,
  FiTrendingUp,
  FiSettings,
} from 'react-icons/fi'
import { IconType } from 'react-icons'

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/transactions', label: 'Transacciones', icon: FiDollarSign },
  { href: '/categories', label: 'Categorías', icon: FiTag },
  { href: '/budgets', label: 'Presupuestos', icon: FiTrendingUp },
  { href: '/settings', label: 'Configuración', icon: FiSettings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <Box
      as="nav"
      w="64"
      bg="white"
      borderRightWidth="1px"
      borderColor="gray.200"
      h="full"
      p={4}
      flexShrink={0}
    >
      <VStack gap={2} align="stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'solid' : 'ghost'}
              colorPalette={isActive ? 'brand' : 'gray'}
              justifyContent="flex-start"
              gap={2}
            >
              <Link href={item.href}>
                <Icon as={item.icon} />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </VStack>
    </Box>
  )
}
