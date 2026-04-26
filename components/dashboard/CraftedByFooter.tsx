'use client'

import { Flex, Text, Icon } from '@chakra-ui/react'
import { FiHeart } from 'react-icons/fi'

function NextJsLogo() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 180 180"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.7 }}
    >
      <path d="M90 0L174.853 155.25H5.14746L90 0Z" />
    </svg>
  )
}

export function CraftedByFooter() {
  return (
    <Flex align="center" gap="4px" justify="center" flexWrap="wrap">
      <Text fontSize="xs" color="#6B7280">Crafted with</Text>
      <Icon as={FiHeart} color="#E53E3E" boxSize="12px" />
      <Text fontSize="xs" color="#6B7280">and</Text>
      <NextJsLogo />
      <Text fontSize="xs" color="#6B7280">by</Text>
      <Text fontSize="xs" color="#9CA3AF" fontWeight="medium">Sanghel González</Text>
    </Flex>
  )
}
