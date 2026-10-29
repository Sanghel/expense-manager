'use client'

import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface PageTab<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  /** Mono uppercase line above the title ("JUE 29 OCT 2026"). */
  eyebrow?: string
  title: string
  tabs?: PageTab<T>[]
  activeTab?: T
  onTabChange?: (tab: T) => void
  /** Extra controls next to the tabs (month selector, buttons…). */
  actions?: ReactNode
}

/** Pulso page header: eyebrow + H1 on the left, sub-tabs as pills on the right. */
export function PageHeader<T extends string>({ eyebrow, title, tabs, activeTab, onTabChange, actions }: Props<T>) {
  return (
    <Flex justify="space-between" align={{ base: 'flex-start', md: 'flex-end' }} gap={4} wrap="wrap" mb={7}>
      <Box minW={0}>
        {eyebrow && (
          <Text textStyle="eyebrow" color="text3" mb={2}>
            {eyebrow}
          </Text>
        )}
        <Heading as="h1" textStyle="pageTitle" color="text">
          {title}
        </Heading>
      </Box>
      {(tabs || actions) && (
        <Flex gap={2} align="center" wrap="wrap">
          {tabs && (
            <Flex role="tablist" gap={2} wrap="wrap">
              {tabs.map((tab) => {
                const active = tab.value === activeTab
                return (
                  <Button
                    key={tab.value}
                    role="tab"
                    aria-selected={active}
                    onClick={() => onTabChange?.(tab.value)}
                    h="36px"
                    px={4}
                    fontSize="sm"
                    fontWeight="medium"
                    bg={active ? 'text' : 'transparent'}
                    color={active ? 'bg' : 'text2'}
                    boxShadow={active ? 'none' : 'inset 0 0 0 1px var(--chakra-colors-line)'}
                    _hover={active ? undefined : { bg: 'surface2', color: 'text' }}
                    transition="background 150ms, color 150ms"
                  >
                    {tab.label}
                  </Button>
                )
              })}
            </Flex>
          )}
          {actions}
        </Flex>
      )}
    </Flex>
  )
}
