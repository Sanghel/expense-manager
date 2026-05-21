import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { autoCommitGmailForUser } from '@/lib/gmail/process'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const start = new Date().toISOString()
  console.log(`[cron:sync-gmail] start=${start}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:sync-gmail] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: users, error } = await insforgeAdmin.database
      .from('users')
      .select('id, email')
      .not('gmail_refresh_token', 'is', null)
    if (error) throw error

    const connected = (users ?? []) as Array<{ id: string; email: string }>
    let totalScanned = 0
    let totalCreated = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    for (const user of connected) {
      try {
        const { parse, commit } = await autoCommitGmailForUser(user.id)
        totalScanned += parse.scanned
        totalCreated += commit.created
        totalSkipped += parse.skipped
        allErrors.push(...parse.errorMessages.map((e) => `${user.id}: parse: ${e}`))
        allErrors.push(...commit.errors.map((e) => `${user.id}: commit: ${e}`))
        console.log(
          `[cron:sync-gmail] user=${user.id} scanned=${parse.scanned} created=${commit.created} skipped=${parse.skipped}`
        )
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err)
        console.error(`[cron:sync-gmail] user=${user.id} fatal=`, m)
        allErrors.push(`${user.id}: fatal: ${m}`)
      }
    }

    console.log(
      `[cron:sync-gmail] done users=${connected.length} scanned=${totalScanned} created=${totalCreated} skipped=${totalSkipped} errors=${allErrors.length}`
    )
    return NextResponse.json({
      ok: true,
      usersProcessed: connected.length,
      scanned: totalScanned,
      created: totalCreated,
      skipped: totalSkipped,
      errors: allErrors.length > 0 ? allErrors : undefined,
    })
  } catch (error) {
    console.error('[cron:sync-gmail] unhandled', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
