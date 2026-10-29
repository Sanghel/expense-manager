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
  Button,
  HStack,
  Text,
} from '@chakra-ui/react'
import { PortalContainerProvider } from '@/components/ui/FloatingPortal'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { SHEET_CONTENT_PROPS, SHEET_PLACEMENT } from '@/components/ui/dialog-sheet'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  isLoading?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
}: Props) {
  // Floating panels (combobox, pickers) render inside the dialog so they stay clickable.
  const contentRef = useRef<HTMLDivElement>(null)
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={details => !details.open && onClose()}
      role="alertdialog"
      placement={SHEET_PLACEMENT}
      lazyMount
      unmountOnExit
      closeOnInteractOutside={false}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent ref={contentRef} tabIndex={-1} {...SHEET_CONTENT_PROPS}>
          <PortalContainerProvider container={contentRef}>
            <DialogHeader borderBottomWidth="1px" borderColor="line" py={4}>
              <HStack justify="space-between" align="center" w="full">
                <DialogTitle color="text" fontSize="18px" fontWeight="600">{title}</DialogTitle>
                <ActionIconButton kind="close" label="Cerrar" size="sm" variant="ghost" onClick={onClose} />
              </HStack>
            </DialogHeader>
            <DialogBody pb={6} pt={4}>
              <Text mb={4} color="text2">{description}</Text>
              <HStack justify="flex-end" gap={3}>
                <Button variant="ghost" color="text2" onClick={onClose} disabled={isLoading}>
                  {cancelLabel}
                </Button>
                <Button bg="neg" color="bg" _hover={{ opacity: 0.9 }} onClick={onConfirm} loading={isLoading}>
                  {confirmLabel}
                </Button>
              </HStack>
            </DialogBody>
          </PortalContainerProvider>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
