'use client'

import { Button } from '@chakra-ui/react'

interface Props {
  onClick: () => void
  children?: React.ReactNode
  disabled?: boolean
}

export function CancelButton({ onClick, children = 'Cancelar', disabled }: Props) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  )
}
