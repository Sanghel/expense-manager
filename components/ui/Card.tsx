import { Box, BoxProps } from '@chakra-ui/react'

export function Card({ children, ...props }: BoxProps) {
  return (
    <Box
      bg="#1a1a23"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="#2d2d35"
      p={6}
      shadow="md"
      {...props}
    >
      {children}
    </Box>
  )
}
