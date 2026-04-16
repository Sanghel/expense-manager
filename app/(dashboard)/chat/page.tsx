import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Box, Heading, Text, VStack } from '@chakra-ui/react'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const { data: user } = await insforgeAdmin.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    redirect('/login')
  }

  const categoriesResult = await getCategories(user.id)
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : []

  return (
    <VStack gap={0} h="full" align="stretch">
      <Box pb={4}>
        <Heading size="lg" color="white">Chat IA</Heading>
        <Text color="#B0B0B0" fontSize="sm" mt={1}>
          Registra gastos e ingresos escribiendo en lenguaje natural
        </Text>
      </Box>

      <Box
        flex="1"
        borderWidth="1px"
        borderColor="#2d2d35"
        borderRadius="xl"
        overflow="hidden"
        bg="#18181d"
        shadow="md"
      >
        <ChatInterface userId={user.id} categories={categories} />
      </Box>
    </VStack>
  )
}
