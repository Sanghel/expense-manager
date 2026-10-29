'use client'

import { Button } from '@chakra-ui/react'

interface Props {
  children: React.ReactNode
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  width?: string
  disabled?: boolean
}

export function PrimaryButton({
  children,
  loading,
  onClick,
  type = 'button',
  width,
  disabled,
}: Props) {
  return (
    <Button
      type={type}
      bg="brandSolid"
      color="white"
      _hover={{ bg: 'brand.600' }}
      loading={loading}
      onClick={onClick}
      width={width}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}
