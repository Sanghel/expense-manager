import { insforgeAdmin } from '../insforge-admin'
import { applyBalanceDelta } from '../utils/balance-updater'
import { getAccessToken, listMessages, getMessage } from './client'
import { parseBancolombia, isBancolombiaSender } from './parsers/bancolombia'

const AUTO_REGISTER_THRESHOLD = 0.85
const DEFAULT_LOOKBACK_DAYS = 7

const BANCOLOMBIA_QUERY =
  'from:(notificacionesbancolombia@bancolombia.com.co OR alertasynotificaciones@notificacionesbancolombia.com OR alertasynotificaciones@bancolombia.com.co)'

export interface SyncResult {
  scanned: number
  autoRegistered: number
  drafted: number
  skipped: number
  errors: number
  errorMessages: string[]
}

interface AccountRow {
  id: string
  currency: string
  last_four: string | null
  type: string
}

async function findAccountByLastFour(
  userId: string,
  lastFour: string
): Promise<AccountRow | null> {
  const { data } = await insforgeAdmin.database
    .from('accounts')
    .select('id, currency, last_four, type')
    .eq('user_id', userId)
    .eq('last_four', lastFour)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  return (data as AccountRow | null) ?? null
}

async function alreadyProcessed(messageId: string): Promise<boolean> {
  const { data } = await insforgeAdmin.database
    .from('processed_emails')
    .select('gmail_message_id')
    .eq('gmail_message_id', messageId)
    .maybeSingle()
  return !!data
}

function buildGmailQuery(sinceIso: string | null): string {
  if (sinceIso) {
    // Gmail's `after:` operator expects Unix timestamp in seconds
    const epoch = Math.floor(new Date(sinceIso).getTime() / 1000)
    if (Number.isFinite(epoch) && epoch > 0) {
      return `${BANCOLOMBIA_QUERY} after:${epoch}`
    }
  }
  return `${BANCOLOMBIA_QUERY} newer_than:${DEFAULT_LOOKBACK_DAYS}d`
}

export async function syncGmailForUser(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    scanned: 0,
    autoRegistered: 0,
    drafted: 0,
    skipped: 0,
    errors: 0,
    errorMessages: [],
  }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('gmail_refresh_token, gmail_last_synced_at')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new Error(`User not found: ${userId}`)
  }
  if (!user.gmail_refresh_token) {
    throw new Error('GMAIL_NOT_CONNECTED')
  }

  const accessToken = await getAccessToken(userId)
  const query = buildGmailQuery(user.gmail_last_synced_at)
  const refs = await listMessages(accessToken, query)
  result.scanned = refs.length

  for (const ref of refs) {
    try {
      if (await alreadyProcessed(ref.id)) {
        result.skipped++
        continue
      }

      const msg = await getMessage(accessToken, ref.id)
      const fromHeader = msg.headers['from'] ?? ''
      if (!isBancolombiaSender(fromHeader)) {
        await insforgeAdmin.database.from('processed_emails').insert([
          {
            gmail_message_id: ref.id,
            user_id: userId,
            outcome: 'skipped',
            error_message: 'sender_not_bancolombia',
          },
        ])
        result.skipped++
        continue
      }

      const subject = msg.headers['subject'] ?? ''
      const parsed = parseBancolombia({
        subject,
        bodyText: msg.bodyText,
        bodyHtml: msg.bodyHtml,
        receivedAt: new Date(Number(msg.internalDate)),
      })

      if (!parsed) {
        await insforgeAdmin.database.from('processed_emails').insert([
          {
            gmail_message_id: ref.id,
            user_id: userId,
            outcome: 'skipped',
            error_message: 'parser_no_match',
          },
        ])
        result.skipped++
        continue
      }

      const matchedAccount = parsed.lastFour
        ? await findAccountByLastFour(userId, parsed.lastFour)
        : null

      const canAutoRegister =
        parsed.confidence >= AUTO_REGISTER_THRESHOLD && matchedAccount !== null

      if (canAutoRegister && matchedAccount) {
        // Insert directly (without going through createTransaction since we
        // skip Zod's UUID requirement for category_id — gmail txs land on a
        // catch-all category that the user picks later if desired).
        const { data: created, error: insertError } = await insforgeAdmin.database
          .from('transactions')
          .insert([
            {
              user_id: userId,
              amount: parsed.amount,
              currency: parsed.currency,
              type: parsed.type,
              category_id: null,
              account_id: matchedAccount.id,
              description: parsed.description,
              date: parsed.date,
              source: 'gmail',
              notes: `Gmail: ${parsed.matchedRule} (msg ${ref.id})`,
            },
          ])
          .select('id')
          .single()

        if (insertError || !created) {
          throw new Error(`createTransaction failed: ${JSON.stringify(insertError)}`)
        }

        const direction = parsed.type === 'income' ? 'add' : 'subtract'
        await applyBalanceDelta(matchedAccount.id, parsed.amount, parsed.currency, direction)

        await insforgeAdmin.database.from('processed_emails').insert([
          {
            gmail_message_id: ref.id,
            user_id: userId,
            outcome: 'auto_registered',
            transaction_id: created.id,
          },
        ])
        result.autoRegistered++
      } else {
        const { data: draft, error: draftError } = await insforgeAdmin.database
          .from('transaction_drafts')
          .insert([
            {
              user_id: userId,
              gmail_message_id: ref.id,
              amount: parsed.amount,
              currency: parsed.currency,
              type: parsed.type,
              account_id: matchedAccount?.id ?? null,
              description: parsed.description,
              date: parsed.date,
              raw_subject: subject,
              raw_snippet: msg.snippet,
              raw_from: fromHeader,
              confidence: parsed.confidence,
              parse_reason: matchedAccount
                ? `low_confidence:${parsed.matchedRule}`
                : `no_account_match:${parsed.matchedRule}${parsed.lastFour ? `:${parsed.lastFour}` : ':no_last_four'}`,
              status: 'pending',
            },
          ])
          .select('id')
          .single()

        if (draftError || !draft) {
          throw new Error(`draft insert failed: ${JSON.stringify(draftError)}`)
        }

        await insforgeAdmin.database.from('processed_emails').insert([
          {
            gmail_message_id: ref.id,
            user_id: userId,
            outcome: 'drafted',
            draft_id: draft.id,
          },
        ])
        result.drafted++
      }
    } catch (err) {
      result.errors++
      const msg = err instanceof Error ? err.message : String(err)
      result.errorMessages.push(`${ref.id}: ${msg}`)
      // Best-effort: log the failure so we don't retry the same broken email forever
      await insforgeAdmin.database
        .from('processed_emails')
        .insert([
          {
            gmail_message_id: ref.id,
            user_id: userId,
            outcome: 'error',
            error_message: msg.slice(0, 500),
          },
        ])
        .then(() => undefined, () => undefined)
    }
  }

  await insforgeAdmin.database
    .from('users')
    .update({ gmail_last_synced_at: new Date().toISOString() })
    .eq('id', userId)

  return result
}
