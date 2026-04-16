'use client'

import { useState } from 'react'
import { Box, IconButton, Icon } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { BsStars } from 'react-icons/bs'
import { ChatInterface } from './ChatInterface'
import type { Category } from '@/types/database.types'

interface Props {
  userId: string
  categories: Category[]
}

const MotionBox = motion.create(Box as React.ComponentType<React.ComponentProps<typeof Box>>)

export function FloatingChat({ userId, categories }: Props) {
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
            bottom="88px"
            right="24px"
            w="380px"
            h="520px"
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            borderWidth="1px"
            borderColor="gray.200"
            overflow="hidden"
            zIndex={1000}
          >
            <ChatInterface
              userId={userId}
              categories={categories}
              onClose={() => setIsOpen(false)}
            />
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <Box position="fixed" bottom="24px" right="24px" zIndex={1001}>
        <IconButton
          aria-label={isOpen ? 'Cerrar chat IA' : 'Abrir chat IA'}
          borderRadius="full"
          w="56px"
          h="56px"
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
          <Icon as={BsStars} boxSize={5} color="white" />
        </IconButton>
      </Box>
    </>
  )
}
