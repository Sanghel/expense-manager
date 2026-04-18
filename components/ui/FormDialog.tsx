'use client'

import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  HStack,
  IconButton,
  Icon,
} from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormDialog({ isOpen, onClose, title, children, size = 'md' }: Props) {
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      size={size}
      placement="center"
      lazyMount
      unmountOnExit
      closeOnInteractOutside={false}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent tabIndex={-1} mx={{ base: 3, md: 0 }} maxH="90vh" overflowY="auto">
          <DialogHeader borderBottomWidth="1px" borderColor="#2d2d35" py={4}>
            <HStack justify="space-between" align="center">
              <DialogTitle color="white">{title}</DialogTitle>
              <DialogCloseTrigger asChild>
                <IconButton
                  aria-label="Cerrar"
                  size="sm"
                  variant="ghost"
                  color="#B0B0B0"
                  _hover={{ color: 'white', bg: '#2d2d35' }}
                  onClick={onClose}
                >
                  <Icon as={FiX} />
                </IconButton>
              </DialogCloseTrigger>
            </HStack>
          </DialogHeader>
          <DialogBody pb={6}>
            {children}
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
