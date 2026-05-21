import { NextRequest, NextResponse } from 'next/server'
import { insforgeAdmin } from '@/lib/insforge-admin'
import { syncGmailForUser } from '@/lib/gmail/process'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const start = new Date().toISOString()
  console.log(`[cron:sync-gmail] start=${start}`)

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron:sync-gmail] Unauthorized — invalid or missing CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: users, error } = await insforgeAdmin.database
      .from('users')
      .select('id, email')
      .not('gmail_refresh_token', 'is', null)

    if (error) {
      console.error('[cron:sync-gmail] DB fetch users error:', JSON.stringify(error))
      throw error
    }

    const connectedUsers = (users ?? []) as Array<{ id: string; email: string }>
    console.log(`[cron:sync-gmail] connectedUsers=${connectedUsers.length}`)

    let totalScanned = 0
    let totalAuto = 0
    let totalDrafted = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    for (const user of connectedUsers) {
      console.log(`[cron:sync-gmail] processing userId=${user.id} email=${user.email}`)
      try {
        const result = await syncGmailForUser(user.id)
        totalScanned += result.scanned
        totalAuto += result.autoRegistered
        totalDrafted += result.drafted
        totalSkipped += result.skipped
        if (result.errors > 0) {
          console.error(`[cron:sync-gmail] userId=${user.id} errors=`, result.errorMessages)
          allErrors.push(...result.errorMessages.map((e) => `${user.id}: ${e}`))
        }
        console.log(
          `[cron:sync-gmail] userId=${user.id} scanned=${result.scanned} auto=${result.autoRegistered} drafted=${result.drafted} skipped=${result.skipped}`
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[cron:sync-gmail] userId=${user.id} fatal=`, msg)
        allErrors.push(`${user.id}: ${msg}`)
      }
    }

    console.log(
      `[cron:sync-gmail] done users=${connectedUsers.length} scanned=${totalScanned} auto=${totalAuto} drafted=${totalDrafted} skipped=${totalSkipped} errors=${allErrors.length}`
    )

    return NextResponse.json({
      ok: true,
      usersProcessed: connectedUsers.length,
      scanned: totalScanned,
      autoRegistered: totalAuto,
      drafted: totalDrafted,
      skipped: totalSkipped,
      errors: allErrors.length > 0 ? allErrors : undefined,
    })
  } catch (error) {
    console.error(`[cron:sync-gmail] unhandled error=`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
