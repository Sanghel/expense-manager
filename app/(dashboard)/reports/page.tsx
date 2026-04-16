import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { ExpensesByCategoryChart } from '@/components/charts/ExpensesByCategoryChart'
import { MonthlyComparisonChart } from '@/components/charts/MonthlyComparisonChart'

export default async function ReportsPage() {
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

  return (
    <Box p={4}>
      <Heading mb={8} size="lg">
        Reportes
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Box gridColumn={{ base: 'auto', md: '1 / -1' }}>
          <MonthlyComparisonChart userId={user.id} months={12} />
        </Box>
        <ExpensesByCategoryChart userId={user.id} type="expense" />
        <ExpensesByCategoryChart userId={user.id} type="income" />
      </SimpleGrid>
    </Box>
  )
}
