'use client'

import { useState, useEffect } from 'react'
import { Box, VStack, Button, Icon, Spinner } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import { CraftedByFooter } from './CraftedByFooter'
import {
  FiHome,
  FiBarChart2,
  FiSettings,
  FiTarget,
  FiCalendar,
  FiDownload,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Leer preferencia guardada después del mount (evita hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <Box
      as="nav"
      w={isCollapsed ? '14' : '64'}
      transition="width 0.2s ease"
      bg="#18181d"
      borderRightWidth="1px"
      borderColor="#2d2d35"
      h="full"
      p={4}
      flexShrink={0}
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      overflowY="auto"
      overflowX="hidden"
    >
      <VStack gap={2} align="stretch" flex={1}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isLoading = loadingPath === item.href
          return (
            <Button
              key={item.href}
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              gap={isCollapsed ? 0 : 2}
              bg={isActive ? '#4F46E5' : 'transparent'}
              color={isActive ? 'white' : '#B0B0B0'}
              _hover={{ bg: isActive ? '#4338CA' : '#26262f' }}
              transition="background-color 0.2s ease"
              onClick={() => navigate(item.href)}
              minW={0}
              overflow="hidden"
              px={isCollapsed ? 2 : 4}
              title={isCollapsed ? item.label : undefined}
            >
              {isLoading ? (
                <Spinner size="xs" color={isActive ? 'white' : '#B0B0B0'} />
              ) : (
                <Icon as={item.icon} flexShrink={0} />
              )}
              {!isCollapsed && (
                <Box as="span" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
                  {item.label}
                </Box>
              )}
            </Button>
          )
        })}
      </VStack>

      <Box pt={4} borderTopWidth="1px" borderColor="#2d2d35" mt={4}>
        <Button
          size="sm"
          variant="ghost"
          color="#B0B0B0"
          _hover={{ bg: '#26262f', color: 'white' }}
          onClick={toggle}
          w="full"
          justifyContent={isCollapsed ? 'center' : 'flex-start'}
          gap={2}
          mb={isCollapsed ? 0 : 2}
          title={isCollapsed ? 'Expandir sidebar' : undefined}
        >
          <Icon as={isCollapsed ? FiChevronRight : FiChevronLeft} />
          {!isCollapsed && 'Colapsar'}
        </Button>
        {!isCollapsed && <CraftedByFooter />}
      </Box>
    </Box>
  )
}
