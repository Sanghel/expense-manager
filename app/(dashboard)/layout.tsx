import { Flex, Box } from '@chakra-ui/react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { getCategories } from '@/lib/actions/categories.actions'
import { Header } from '@/components/dashboard/Header'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { FloatingChat } from '@/components/chat/FloatingChat'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  let userId: string | null = null
  let categories: Awaited<ReturnType<typeof getCategories>>['data'] = []

  if (session?.user?.email) {
    const { data: user } = await insforgeAdmin.database
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (user) {
      userId = user.id
      const result = await getCategories(user.id)
      categories = result.success ? result.data : []
    }
  }

  return (
    <Flex direction="column" h="100vh" bg="#0f0f13">
      <Header />
      <Flex flex="1" overflow="hidden" bg="#0f0f13">
        <Sidebar />
        <Box as="main" flex="1" overflow="auto" p={8} bg="#0f0f13">
          {children}
        </Box>
      </Flex>
      {userId && (
        <FloatingChat userId={userId} categories={categories ?? []} />
      )}
    </Flex>
  )
}
