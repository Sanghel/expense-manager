import { Box, BoxProps } from '@chakra-ui/react'

export function Card({ children, ...props }: BoxProps) {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      p={6}
      shadow="sm"
      {...props}
    >
      {children}
    </Box>
  )
}
