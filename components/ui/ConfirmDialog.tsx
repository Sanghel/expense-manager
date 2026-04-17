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
  Button,
  HStack,
  Text,
} from '@chakra-ui/react'

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
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={details => !details.open && onClose()}
      role="alertdialog"
      placement="center"
      lazyMount
      unmountOnExit
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent tabIndex={-1}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            <Text mb={4}>{description}</Text>
            <HStack justify="flex-end" gap={3}>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                {cancelLabel}
              </Button>
              <Button colorPalette="red" onClick={onConfirm} loading={isLoading}>
                {confirmLabel}
              </Button>
            </HStack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
