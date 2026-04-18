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
  IconButton,
  Icon,
} from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'

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
      closeOnInteractOutside={false}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent tabIndex={-1} mx={{ base: 3, md: 0 }}>
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
          <DialogBody pb={6} pt={4}>
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
