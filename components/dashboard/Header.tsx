'use client'

import {
  Box,
  Flex,
  Heading,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Button,
  AvatarRoot,
  AvatarImage,
  AvatarFallback,
} from '@chakra-ui/react'
import { signOut, useSession } from 'next-auth/react'
import { FiLogOut, FiSettings } from 'react-icons/fi'

export function Header() {
  const { data: session } = useSession()

  return (
    <Box
      as="header"
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
      px={8}
      py={4}
    >
      <Flex justify="space-between" align="center">
        <Heading size="md" color="brand.600">
          Expense Manager
        </Heading>

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
            <MenuContent>
              <MenuItem value="settings">
                <FiSettings />
                Configuración
              </MenuItem>
              <MenuItem value="logout" onClick={() => signOut()}>
                <FiLogOut />
                Cerrar Sesión
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        )}
      </Flex>
    </Box>
  )
}
