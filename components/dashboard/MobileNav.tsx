'use client'

import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerPositioner,
  DrawerContent,
  DrawerCloseTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  VStack,
  Button,
  Icon,
  Spinner,
} from '@chakra-ui/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  FiHome,
  FiDollarSign,
  FiTag,
  FiTrendingUp,
  FiBarChart2,
  FiSettings,
  FiRepeat,
  FiTarget,
  FiCalendar,
  FiDownload,
  FiCreditCard,
} from 'react-icons/fi'
import { IconType } from 'react-icons'
import { useNavigation } from '@/hooks/useNavigation'

const navItems: { href: string; label: string; icon: IconType }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/transactions', label: 'Transacciones', icon: FiDollarSign },
  { href: '/recurring-transactions', label: 'Recurrentes', icon: FiRepeat },
  { href: '/savings-goals', label: 'Metas de Ahorro', icon: FiTarget },
  { href: '/loans', label: 'Préstamos', icon: FiCreditCard },
  { href: '/tags', label: 'Etiquetas', icon: FiTag },
  { href: '/calendar', label: 'Calendario', icon: FiCalendar },
  { href: '/categories', label: 'Categorías', icon: FiTag },
  { href: '/reports', label: 'Reportes', icon: FiBarChart2 },
  { href: '/budgets', label: 'Presupuestos', icon: FiTrendingUp },
  { href: '/export-data', label: 'Exportar', icon: FiDownload },
  { href: '/settings', label: 'Configuración', icon: FiSettings },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: Props) {
  const pathname = usePathname()
  const { navigate, loadingPath } = useNavigation()

  return (
    <DrawerRoot open={isOpen} onOpenChange={({ open }) => !open && onClose()} placement="start">
      <DrawerBackdrop />
      <DrawerPositioner>
        <DrawerContent bg="#18181d" borderRightWidth="1px" borderColor="#2d2d35" maxW="72">
          <DrawerHeader borderBottomWidth="1px" borderColor="#2d2d35" py={4} px={4}>
            <DrawerTitle>
              <Image src="/brand/money-manager.png" alt="GitPush Money" width={110} height={60} style={{ objectFit: 'contain' }} />
            </DrawerTitle>
          </DrawerHeader>
          <DrawerCloseTrigger color="white" top={3} right={3} />
          <DrawerBody px={3} py={4}>
            <VStack gap={1} align="stretch">
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
                    onClick={() => { navigate(item.href); onClose() }}
                  >
                    {isLoading ? <Spinner size="xs" /> : <Icon as={item.icon} />}
                    {item.label}
                  </Button>
                )
              })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </DrawerPositioner>
    </DrawerRoot>
  )
}
