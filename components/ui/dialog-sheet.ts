import type { DialogContentProps, DialogRootProps } from '@chakra-ui/react'

/**
 * Pulso dialogs: centered on desktop, bottom sheet on mobile
 * (radius 28 on top only, full width, max-height 92%).
 */
export const SHEET_PLACEMENT: DialogRootProps['placement'] = { base: 'bottom', md: 'center' }

// `mdDown` instead of responsive props: `{ base: x, md: undefined }` keeps `x`
// on desktop too, and the desktop values come from the dialog `size`.
export const SHEET_CONTENT_PROPS: DialogContentProps = {
  maxH: '90vh',
  css: {
    mdDown: {
      mx: 0,
      mb: 0,
      maxW: 'full',
      maxH: '92dvh',
      borderBottomRadius: 0,
    },
  },
}
