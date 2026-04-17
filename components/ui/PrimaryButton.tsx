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
      bg="#4F46E5"
      color="white"
      _hover={{ bg: '#4338CA' }}
      loading={loading}
      onClick={onClick}
      width={width}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}
