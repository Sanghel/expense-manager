import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { generateRecurringTransactions } from '@/lib/actions/recurring.actions'

export async function GET(req: NextRequest) {
  const start = new Date().toISOString()
  console.log(`[cron:generate-recurring] start=${start}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:generate-recurring] Unauthorized — invalid or missing CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: users, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select('user_id')
      .eq('is_active', true)

    if (error) {
      console.error('[cron:generate-recurring] DB fetch users error:', JSON.stringify(error))
      throw error
    }

    const uniqueUserIds = [...new Set((users ?? []).map((r: { user_id: string }) => r.user_id))]
    console.log(`[cron:generate-recurring] activeUsers=${uniqueUserIds.length}`)

    const results = await Promise.all(
      uniqueUserIds.map((userId) => generateRecurringTransactions(userId as string))
    )

    const totalGenerated = results.reduce(
      (sum, r) => sum + (r.success && r.data ? r.data.generated : 0),
      0
    )

    const failures = results.filter((r) => !r.success)
    if (failures.length > 0) {
      console.error(`[cron:generate-recurring] failures=${failures.length}`, failures.map((f) => f.error))
    }

    console.log(`[cron:generate-recurring] done usersProcessed=${uniqueUserIds.length} transactionsGenerated=${totalGenerated}`)
    return NextResponse.json({
      ok: true,
      usersProcessed: uniqueUserIds.length,
      transactionsGenerated: totalGenerated,
    })
  } catch (error) {
    console.error('[cron:generate-recurring] unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
