import { Box, Heading, VStack } from '@chakra-ui/react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforge } from '@/lib/insforge'
import { FinancialCards } from '@/components/dashboard/FinancialCards'
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  // Obtener user ID de la BD
  const { data: user } = await insforge.database
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    redirect('/login')
  }

  return (
    <Box>
      <Heading mb={8}>Dashboard</Heading>

      <VStack gap={8} align="stretch">
        <FinancialCards userId={user.id} />

        <MonthlyTrendChart userId={user.id} />

        <RecentTransactions userId={user.id} limit={10} />
      </VStack>
    </Box>
  )
}
