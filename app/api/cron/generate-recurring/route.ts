import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { generateRecurringTransactions } from '@/lib/actions/recurring.actions'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: users, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select('user_id')
      .eq('is_active', true)

    if (error) throw error

    const uniqueUserIds = [...new Set((users ?? []).map((r: { user_id: string }) => r.user_id))]

    const results = await Promise.all(
      uniqueUserIds.map((userId) => generateRecurringTransactions(userId as string))
    )

    const totalGenerated = results.reduce(
      (sum, r) => sum + (r.success && r.data ? r.data.generated : 0),
      0
    )

    return NextResponse.json({
      ok: true,
      usersProcessed: uniqueUserIds.length,
      transactionsGenerated: totalGenerated,
    })
  } catch (error) {
    console.error('Cron generate-recurring error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
