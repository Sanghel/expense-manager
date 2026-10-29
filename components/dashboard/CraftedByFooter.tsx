'use client'

import { Flex, Text, Icon } from '@chakra-ui/react'
import { FiHeart } from 'react-icons/fi'

function NextJsLogo() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 180 180"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.7 }}
    >
      <path d="M90 0L174.853 155.25H5.14746L90 0Z" />
    </svg>
  )
}

export function CraftedByFooter() {
  return (
    <Flex align="center" gap="4px" justify="center" flexWrap="wrap" color="text3">
      <Text fontSize="xs" color="text3">Crafted with</Text>
      <Icon as={FiHeart} color="neg" boxSize="12px" />
      <Text fontSize="xs" color="text3">and</Text>
      <NextJsLogo />
      <Text fontSize="xs" color="text3">by</Text>
      <Text fontSize="xs" color="text2" fontWeight="medium">Sanghel González</Text>
    </Flex>
  )
}
