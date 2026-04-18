'use client'

import { useState } from 'react'
import { Box, IconButton, Icon } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { BsStars } from 'react-icons/bs'
import { ChatInterface } from './ChatInterface'
import type { Account, Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
  accounts?: Account[]
}

const MotionBox = motion.create(Box as React.ComponentType<React.ComponentProps<typeof Box>>)

export function FloatingChat({ userId, categories, accounts = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            position="fixed"
            zIndex={1000}
            bg="#18181d"
            borderRadius={{ base: '2xl', md: '2xl' }}
            shadow="2xl"
            borderWidth="1px"
            borderColor="#2d2d35"
            overflow="hidden"
            /* Desktop */
            bottom={{ base: '130px', md: '88px' }}
            right={{ base: '12px', md: '24px' }}
            left={{ base: '12px', md: 'auto' }}
            w={{ base: 'auto', md: '380px' }}
            h={{ base: 'calc(100vh - 210px)', md: '520px' }}
            maxH={{ base: '560px', md: '520px' }}
          >
            <ChatInterface
              userId={userId}
              categories={categories}
              accounts={accounts}
              onClose={() => setIsOpen(false)}
            />
          </MotionBox>
        )}
      </AnimatePresence>

      <Box
        position="fixed"
        bottom={{ base: '72px', md: '24px' }}
        right="16px"
        zIndex={1001}
      >
        <IconButton
          aria-label={isOpen ? 'Cerrar chat IA' : 'Abrir chat IA'}
          borderRadius="full"
          w={{ base: '46px', md: '56px' }}
          h={{ base: '46px', md: '56px' }}
          colorPalette="brand"
          shadow="lg"
          onClick={() => setIsOpen((prev) => !prev)}
          css={{
            background: isOpen
              ? 'var(--chakra-colors-brand-600)'
              : 'linear-gradient(135deg, var(--chakra-colors-brand-400), var(--chakra-colors-brand-600))',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            _hover: {
              transform: 'scale(1.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            },
          }}
        >
          <Icon as={BsStars} boxSize={{ base: 4, md: 5 }} color="white" />
        </IconButton>
      </Box>
    </>
  )
}
