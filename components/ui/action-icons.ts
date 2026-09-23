import type { IconType } from 'react-icons'
import { LuPencil, LuTrash2 } from 'react-icons/lu'

/**
 * Single source of truth for the icon of each utility action (FR-010).
 * The same action must always use the same Lucide icon across the app,
 * so add new actions here instead of importing icons ad hoc.
 */
export const ACTION_ICONS = {
  edit: LuPencil,
  delete: LuTrash2,
} satisfies Record<string, IconType>

export type ActionKind = keyof typeof ACTION_ICONS
