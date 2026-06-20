'use client'

import { Box, VStack, HStack, Text, Button, Icon, Spinner } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { CraftedByFooter } from './CraftedByFooter'
import logo from '@/public/brand/gh_push_money_logo.png'
import {
  FiHome,
  FiBarChart2,
  FiSettings,
  FiTarget,
  FiCalendar,
  FiLayers,
  FiZap,
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
  { href: '/consejos-ahorro', label: 'Consejos de Ahorro', icon: FiZap },
  { href: '/settings', label: 'Configuración', icon: FiSettings },
]

interface Props {
  isCollapsed: boolean
  toggle: () => void
}

export function Sidebar({ isCollapsed, toggle }: Props) {
  const pathname = usePathname()
  const { navigate, loadingPath } = useNavigation()

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

      {/* Brand / logo */}
      <Box
        px={isCollapsed ? 0 : 3}
        py={4}
        borderBottomWidth="1px"
        borderColor="#2d2d35"
        flexShrink={0}
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <HStack gap={2} justify={isCollapsed ? 'center' : 'flex-start'} align="center">
          <Image src={logo} alt="GitPush Money" width={30} height={30} style={{ flexShrink: 0 }} />
          {!isCollapsed && (
            <HStack gap={1} align="center">
              <Text fontSize="18px" fontWeight="bold" color="brand.300">
                GitPush
              </Text>
              <Text fontSize="18px" fontWeight="bold" color="brand.200">
                Money
              </Text>
            </HStack>
          )}
        </HStack>
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
