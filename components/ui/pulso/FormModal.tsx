'use client'

import { useRef } from 'react'
import {
  Box,
  Button,
  DialogBackdrop,
  DialogContent,
  DialogPositioner,
  DialogRoot,
  Flex,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { PortalContainerProvider } from '@/components/ui/FloatingPortal'
import { SHEET_CONTENT_PROPS, SHEET_PLACEMENT } from '@/components/ui/dialog-sheet'

interface ContentProps {
  onClose: () => void
  /** Heading. */
  title: string
  subtitle?: React.ReactNode
  /** Replaces the title block (e.g. a type segmented); the close button stays. */
  header?: React.ReactNode
  onSubmit: () => void | Promise<void>
  /** The primary stays at half opacity until the form is valid. */
  canSubmit: boolean
  loading?: boolean
  submitLabel: React.ReactNode
  /** Left side of the footer: a destructive action or a secondary link. */
  footerStart?: React.ReactNode
  /** Nested dialogs, rendered outside the <form> so their submits don't bubble into it. */
  overlays?: React.ReactNode
  children: React.ReactNode
}

/**
 * Pulso form modal: centered on desktop (580px), bottom sheet on mobile.
 * `children` unmount on close, so a form body that keeps its state inside
 * (and renders `FormModalContent`) starts fresh on every opening.
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  /** The dialog's accessible name. */
  title: string
  children: React.ReactNode
}) {
  // Floating panels (pickers inside nested dialogs) render inside the dialog.
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
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
          aria-label={title}
          w="min(580px, calc(100vw - 32px))"
          {...SHEET_CONTENT_PROPS}
          maxW={{ base: 'full', md: 'none' }}
          display="flex"
          flexDirection="column"
        >
          <PortalContainerProvider container={contentRef}>
            {children}
          </PortalContainerProvider>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  )
}

/** Header (title or custom slot + close), scrolling body and footer, inside a <form>. */
export function FormModalContent({
  onClose,
  title,
  subtitle,
  header,
  onSubmit,
  canSubmit,
  loading = false,
  submitLabel,
  footerStart,
  overlays,
  children,
}: ContentProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit && !loading) onSubmit()
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <Flex justify="space-between" align="flex-start" gap={3} px="22px" pt="22px" pb="6px" flexShrink={0}>
          <Box minW={0}>
            {header ?? (
              <>
                <Text as="h2" fontSize="18px" fontWeight="600" letterSpacing="-0.01em" color="text">
                  {title}
                </Text>
                {subtitle && (
                  <Text fontSize="13px" color="text3" mt={0.5}>
                    {subtitle}
                  </Text>
                )}
              </>
            )}
          </Box>
          <IconButton
            aria-label="Cerrar"
            onClick={onClose}
            boxSize="36px"
            minW="36px"
            borderRadius="full"
            bg="surface2"
            color="text2"
            flexShrink={0}
            _hover={{ color: 'text' }}
          >
            <LuX />
          </IconButton>
        </Flex>

        <Stack gap={5} flex="1" minH={0} overflowY="auto" px="22px" pt="14px" pb="22px">
          {children}
        </Stack>

        <Flex
          align="center"
          gap={2}
          px="22px"
          pt="14px"
          pb="18px"
          borderTopWidth="1px"
          borderColor="line"
          flexShrink={0}
          wrap="wrap"
        >
          {footerStart}
          <Flex gap={2} ms="auto">
            <Button variant="ghost" color="text2" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              h="44px"
              px={5}
              fontSize="14px"
              fontWeight="500"
              bg="brandSolid"
              color="white"
              _hover={{ bg: 'brand.600' }}
              loading={loading}
              disabled={!canSubmit}
              _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              {submitLabel}
            </Button>
          </Flex>
        </Flex>
      </form>
      {overlays}
    </>
  )
}
