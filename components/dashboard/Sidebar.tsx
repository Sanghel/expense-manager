'use client'

import { Box, VStack, Button, Icon, Spinner } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import {
  FiHome,
  FiBarChart2,
  FiSettings,
  FiTarget,
  FiCalendar,
  FiDownload,
  FiLayers,
} from 'react-icons/fi'
import { IconType } from 'react-icons'
import { useNavigation } from '@/hooks/useNavigation'

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/movimientos', label: 'Movimientos', icon: FiLayers },
  { href: '/planificacion', label: 'Planificación', icon: FiTarget },
  { href: '/calendar', label: 'Calendario', icon: FiCalendar },
  { href: '/reports', label: 'Reportes', icon: FiBarChart2 },
  { href: '/export-data', label: 'Exportar', icon: FiDownload },
  { href: '/settings', label: 'Configuración', icon: FiSettings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { navigate, loadingPath } = useNavigation()

  return (
    <Box
      as="nav"
      w="64"
      bg="#18181d"
      borderRightWidth="1px"
      borderColor="#2d2d35"
      h="full"
      p={4}
      flexShrink={0}
      display={{ base: 'none', md: 'block' }}
      overflowY="auto"
    >
      <VStack gap={2} align="stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isLoading = loadingPath === item.href
          return (
            <Button
              key={item.href}
              justifyContent="flex-start"
              gap={2}
              bg={isActive ? '#4F46E5' : 'transparent'}
              color={isActive ? 'white' : '#B0B0B0'}
              _hover={{ bg: isActive ? '#4338CA' : '#26262f' }}
              transition="background-color 0.2s ease"
              onClick={() => navigate(item.href)}
            >
              {isLoading ? <Spinner size="xs" /> : <Icon as={item.icon} />}
              {item.label}
            </Button>
          )
        })}
      </VStack>
    </Box>
  )
}
