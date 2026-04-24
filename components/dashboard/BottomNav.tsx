'use client'

import { Box, Flex, Text, Icon, Spinner } from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import {
  FiHome,
  FiLayers,
  FiTarget,
  FiBarChart2,
  FiMoreHorizontal,
} from 'react-icons/fi'
import { IconType } from 'react-icons'
import { useNavigation } from '@/hooks/useNavigation'

const primaryItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/movimientos', label: 'Movimientos', icon: FiLayers },
  { href: '/savings-goals', label: 'Metas', icon: FiTarget },
  { href: '/reports', label: 'Reportes', icon: FiBarChart2 },
]

interface Props {
  onMoreClick: () => void
}

export function BottomNav({ onMoreClick }: Props) {
  const pathname = usePathname()
  const { navigate, loadingPath } = useNavigation()

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
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Flex>
        {primaryItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const isLoading = loadingPath === item.href
          return (
            <Flex
              key={item.href}
              flex={1}
              direction="column"
              align="center"
              justify="center"
              py={2}
              gap="2px"
              color={isActive ? '#6366F1' : '#6b7280'}
              _hover={{ color: '#818cf8' }}
              transition="color 0.15s ease"
              cursor="pointer"
              onClick={() => navigate(item.href)}
            >
              {isLoading ? <Spinner size="xs" /> : <Icon as={item.icon} boxSize={5} />}
              <Text fontSize="10px" fontWeight={isActive ? '600' : '400'} lineHeight="1">
                {item.label}
              </Text>
            </Flex>
          )
        })}

        {/* Más — opens the full drawer */}
        <Flex
          flex={1}
          direction="column"
          align="center"
          justify="center"
          py={2}
          gap="2px"
          color="#6b7280"
          _hover={{ color: '#818cf8' }}
          transition="color 0.15s ease"
          cursor="pointer"
          onClick={onMoreClick}
        >
          <Icon as={FiMoreHorizontal} boxSize={5} />
          <Text fontSize="10px" fontWeight="400" lineHeight="1">Más</Text>
        </Flex>
      </Flex>
    </Box>
  )
}
