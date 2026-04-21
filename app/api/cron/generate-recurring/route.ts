import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { generateRecurringForUser } from '@/lib/utils/recurring-generator'

export const dynamic = 'force-dynamic'

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
    const today = new Date().toISOString().split('T')[0]
    console.log(`[cron:generate-recurring] today=${today}`)

    const { data: users, error } = await insforgeAdmin.database
      .from('recurring_transactions')
      .select('user_id')
      .eq('is_active', true)
      .lte('start_date', today)

    if (error) {
      console.error('[cron:generate-recurring] DB fetch users error:', JSON.stringify(error))
      throw error
    }

    const uniqueUserIds = [...new Set((users ?? []).map((r: { user_id: string }) => r.user_id))]
    console.log(`[cron:generate-recurring] activeUsers=${uniqueUserIds.length} userIds=${JSON.stringify(uniqueUserIds)}`)

    let totalGenerated = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    for (const userId of uniqueUserIds) {
      console.log(`[cron:generate-recurring] processing userId=${userId}`)
      const result = await generateRecurringForUser(userId as string)
      totalGenerated += result.generated
      totalSkipped += result.skipped
      if (result.errors.length > 0) {
        console.error(`[cron:generate-recurring] userId=${userId} errors=`, result.errors)
        allErrors.push(...result.errors.map(e => `${userId}: ${e}`))
      }
      console.log(`[cron:generate-recurring] userId=${userId} generated=${result.generated} skipped=${result.skipped}`)
    }

    console.log(`[cron:generate-recurring] done usersProcessed=${uniqueUserIds.length} totalGenerated=${totalGenerated} totalSkipped=${totalSkipped} errors=${allErrors.length}`)

    return NextResponse.json({
      ok: true,
      usersProcessed: uniqueUserIds.length,
      transactionsGenerated: totalGenerated,
      transactionsSkipped: totalSkipped,
      errors: allErrors.length > 0 ? allErrors : undefined,
    })
  } catch (error) {
    console.error(`[cron:generate-recurring] unhandled error=`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
