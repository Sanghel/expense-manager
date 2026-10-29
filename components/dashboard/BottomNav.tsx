'use client'

import { Box, Flex, Icon, Text } from '@chakra-ui/react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS, isNavItemActive } from './nav-items'

/** Mobile bottom nav: 5 columns, icon inside a pill that fills when active. */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <Box
      as="nav"
      aria-label="Principal"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex="sticky"
      bg="bg"
      borderTopWidth="1px"
      borderColor="line"
      display={{ base: 'block', md: 'none' }}
      style={{ paddingBottom: 'max(26px, env(safe-area-inset-bottom))' }}
    >
      <Flex pt={2}>
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href)
          return (
            <Flex
              key={item.href}
              asChild
              flex={1}
              direction="column"
              align="center"
              gap={1}
              color={active ? 'brand' : 'text3'}
              transition="color 150ms"
            >
              <NextLink href={item.href} aria-current={active ? 'page' : undefined}>
                <Flex
                  align="center"
                  justify="center"
                  w="44px"
                  h="28px"
                  borderRadius="pill"
                  bg={active ? 'brandSoft' : 'transparent'}
                  transition="background 150ms"
                >
                  <Icon as={item.icon} boxSize="18px" />
                </Flex>
                <Text fontSize="10px" fontWeight="500" lineHeight="1">
                  {item.shortLabel}
                </Text>
              </NextLink>
            </Flex>
          )
        })}
      </Flex>
    </Box>
  )
}
