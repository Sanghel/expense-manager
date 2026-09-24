'use client'

import { useRef } from 'react'
import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  HStack,
} from '@chakra-ui/react'
import { PortalContainerProvider } from '@/components/ui/FloatingPortal'
import { ActionIconButton } from '@/components/ui/ActionIconButton'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormDialog({ isOpen, onClose, title, children, size = 'md' }: Props) {
  // Floating panels (combobox, pickers) render inside the dialog so they stay clickable.
  const contentRef = useRef<HTMLDivElement>(null)
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
        <DialogContent
          ref={contentRef}
          tabIndex={-1}
          mx={{ base: 3, md: 0 }}
          maxH={{ base: '85vh', md: '90vh' }}
          display="flex"
          flexDirection="column"
        >
          <PortalContainerProvider container={contentRef}>
            <DialogHeader borderBottomWidth="1px" borderColor="#2d2d35" py={4} flexShrink={0}>
              <HStack justify="space-between" align="center" w="full">
                <DialogTitle color="white">{title}</DialogTitle>
                <ActionIconButton kind="close" label="Cerrar" size="sm" variant="ghost" onClick={onClose} />
              </HStack>
            </DialogHeader>
            <DialogBody pb={6} flex="1" minH="0" overflowY="auto">
              {children}
            </DialogBody>
          </PortalContainerProvider>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
