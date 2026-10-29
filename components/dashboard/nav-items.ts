import type { IconType } from 'react-icons'
import { LuCalendar, LuHouse, LuLayers, LuSettings, LuTarget } from 'react-icons/lu'

export interface NavItem {
  href: string
  label: string
  /** Short label for the mobile bottom nav. */
  shortLabel: string
  icon: IconType
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', shortLabel: 'Inicio', icon: LuHouse },
  { href: '/movimientos', label: 'Movimientos', shortLabel: 'Movim.', icon: LuLayers },
  { href: '/planificacion', label: 'Planificación', shortLabel: 'Plan', icon: LuTarget },
  { href: '/calendar', label: 'Calendario', shortLabel: 'Agenda', icon: LuCalendar },
  { href: '/settings', label: 'Ajustes', shortLabel: 'Ajustes', icon: LuSettings },
]

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
