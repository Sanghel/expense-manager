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
} from '@chakra-ui/react'

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
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent tabIndex={-1}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody pb={6}>
            {children}
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}
