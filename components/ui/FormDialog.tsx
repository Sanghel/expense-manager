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
import { SHEET_CONTENT_PROPS, SHEET_PLACEMENT } from '@/components/ui/dialog-sheet'

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
      placement={SHEET_PLACEMENT}
      lazyMount
      unmountOnExit
      closeOnInteractOutside={false}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent
          ref={contentRef}
          tabIndex={-1}
          {...SHEET_CONTENT_PROPS}
          display="flex"
          flexDirection="column"
        >
          <PortalContainerProvider container={contentRef}>
            <DialogHeader borderBottomWidth="1px" borderColor="line" py={4} flexShrink={0}>
              <HStack justify="space-between" align="center" w="full">
                <DialogTitle color="text" fontSize="18px" fontWeight="600">{title}</DialogTitle>
                <ActionIconButton kind="close" label="Cerrar" size="sm" variant="ghost" onClick={onClose} />
              </HStack>
            </DialogHeader>
            <DialogBody pt={5} pb={6} flex="1" minH="0" overflowY="auto">
              {children}
            </DialogBody>
          </PortalContainerProvider>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
