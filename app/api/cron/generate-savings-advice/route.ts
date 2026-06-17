import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { generateSavingsAdvice } from '@/lib/actions/savingsAdvice.actions'

export const dynamic = 'force-dynamic'
// Generating advice for every user can take a while; allow up to 5 min.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  console.log(`[cron:generate-savings-advice] start=${new Date().toISOString()}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:generate-savings-advice] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users, error } = await insforgeAdmin.database
    .from('users')
    .select('id')

  if (error) {
    console.error('[cron:generate-savings-advice] failed to list users:', JSON.stringify(error))
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const user of (users ?? []) as { id: string }[]) {
    try {
      const result = await generateSavingsAdvice(user.id)
      if (!result.success) failed++
      else if (result.skipped) skipped++
      else generated++
    } catch (err) {
      // Isolate per-user failures so one bad user doesn't abort the batch.
      failed++
      console.error(`[cron:generate-savings-advice] user=${user.id} error:`, err)
    }
  }

  console.log(
    `[cron:generate-savings-advice] done generated=${generated} skipped=${skipped} failed=${failed}`
  )
  return NextResponse.json({ ok: true, generated, skipped, failed })
}
