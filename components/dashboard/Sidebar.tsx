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
  FiChevronsLeft,
  FiChevronsRight,
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
      position="relative"
      w={isCollapsed ? '16' : '64'}
      transition="width 0.2s ease"
      bg="#18181d"
      borderRightWidth="1px"
      borderColor="#2d2d35"
      h="full"
      flexShrink={0}
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
    >
      {/* Floating toggle button on right edge */}
      <Box
        as="button"
        onClick={toggle}
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="absolute"
        top="14px"
        right="-11px"
        w="22px"
        h="22px"
        borderRadius="full"
        bg="#18181d"
        color="#B0B0B0"
        borderWidth="1px"
        borderColor="#2d2d35"
        _hover={{ bg: '#26262f', color: 'white', borderColor: '#4F46E5' }}
        transition="all 0.2s ease"
        zIndex={10}
        boxShadow="0 1px 4px rgba(0,0,0,0.5)"
        title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        <Icon as={isCollapsed ? FiChevronsRight : FiChevronsLeft} boxSize="2.5" />
      </Box>

      {/* Scrollable nav content */}
      <Box flex={1} overflowY="auto" overflowX="hidden" display="flex" flexDirection="column" pt={3}>
        <Box px={isCollapsed ? 2 : 3} flex={1}>
          <VStack gap={1} align="stretch">
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
                  px={isCollapsed ? 0 : 3}
                  h="10"
                  borderRadius="lg"
                  overflow="hidden"
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
        </Box>

        {/* Footer */}
        {!isCollapsed && (
          <Box px={3} pt={4} pb={4} borderTopWidth="1px" borderColor="#2d2d35" mt={4}>
            <CraftedByFooter />
          </Box>
        )}
      </Box>
    </Box>
  )
}
