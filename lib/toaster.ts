import { createToaster } from '@chakra-ui/react'

export const toaster = createToaster({
  // Pulso: centered pill at the bottom, above the mobile bottom nav.
  placement: 'bottom',
  offsets: { top: '16px', right: '16px', bottom: '96px', left: '16px' },
  pauseOnPageIdle: true,
})
