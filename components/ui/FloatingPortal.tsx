'use client'

import { Portal } from '@chakra-ui/react'
import { createContext, useContext, type ReactNode, type RefObject } from 'react'

type Container = RefObject<HTMLElement | null>

const PortalContainerContext = createContext<Container | null>(null)

/**
 * Marks a modal's content as the portal target for floating panels. Modal
 * dialogs set `pointer-events: none` on <body>, so a combobox list or calendar
 * portalled to <body> can't be clicked; rendering it inside the dialog can.
 */
export function PortalContainerProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
}

/** Portal for floating panels (combobox, date/color pickers): <body>, or the enclosing dialog. */
export function FloatingPortal({ children }: { children: ReactNode }) {
  const container = useContext(PortalContainerContext)
  return <Portal container={container ?? undefined}>{children}</Portal>
}
