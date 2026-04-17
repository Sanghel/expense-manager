'use client'

import {
  Box,
  Flex,
  Heading,
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
  MenuContent,
  MenuItem,
  Button,
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
} from '@chakra-ui/react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FiLogOut, FiSettings } from 'react-icons/fi'
import Image from 'next/image'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <Box
      as="header"
      bg="#18181d"
      borderBottomWidth="1px"
      borderColor="#2d2d35"
      px={{ base: 4, md: 6 }}
      py={3}
      flexShrink={0}
    >
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={2}>
          <Image src="/brand/money-manager.svg" alt="GitPush Money" width={28} height={28} />
          <Heading size="sm" color="white" letterSpacing="tight">
            GitPush Money
          </Heading>
        </Flex>

        {session?.user && (
          <MenuRoot>
            <MenuTrigger asChild>
              <Button variant="ghost" rounded="full" p={0} minW="auto" h="auto">
                <AvatarRoot size="sm">
                  <AvatarImage src={session.user.image ?? ''} />
                  <AvatarFallback>{session.user.name?.charAt(0) ?? '?'}</AvatarFallback>
                </AvatarRoot>
              </Button>
            </MenuTrigger>
            <MenuPositioner>
              <MenuContent minW="44">
                <MenuItem value="settings" onClick={() => router.push('/settings')}>
                  <FiSettings />
                  Configuración
                </MenuItem>
                <MenuItem value="logout" color="red.600" onClick={() => signOut()}>
                  <FiLogOut />
                  Cerrar Sesión
                </MenuItem>
              </MenuContent>
            </MenuPositioner>
          </MenuRoot>
        )}
      </Flex>
    </Box>
  )
}
