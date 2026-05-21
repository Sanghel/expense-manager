import { insforgeAdmin } from '../insforge-admin'
import { applyBalanceDelta } from '../utils/balance-updater'
import { getAccessToken, listMessages, getMessage } from './client'
import { getParserForSender, type ParsedTransaction } from './parsers'

const DEFAULT_LOOKBACK_DAYS = 7

const COMBINED_QUERY =
  'from:(notificacionesbancolombia@bancolombia.com.co OR alertasynotificaciones@notificacionesbancolombia.com OR alertasynotificaciones@bancolombia.com.co OR alertasynotificaciones@an.notificacionesbancolombia.com OR do-not-reply@ses.binance.com OR notificaciones@bancomercantil.com)'

export interface ParsedItem extends ParsedTransaction {
  gmailMessageId: string
  rawFrom: string
  rawSubject: string
  rawSnippet: string
}

export interface ParseResult {
  items: ParsedItem[]
  scanned: number
  skipped: number
  errors: number
  errorMessages: string[]
}

export interface CommitInput extends ParsedTransaction {
  gmailMessageId: string
  category_id: string | null
  account_id?: string | null
}

export interface CommitResult {
  created: number
  errors: string[]
}

interface AccountRow {
  id: string
  currency: string
  last_four: string | null
}

async function findAccountByLastFour(userId: string, lastFour: string): Promise<AccountRow | null> {
  const { data } = await insforgeAdmin.database
    .from('accounts')
    .select('id, currency, last_four')
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

function buildQuery(sinceIso: string | null): string {
  if (sinceIso) {
    const epoch = Math.floor(new Date(sinceIso).getTime() / 1000)
    if (Number.isFinite(epoch) && epoch > 0) return `${COMBINED_QUERY} after:${epoch}`
  }
  return `${COMBINED_QUERY} newer_than:${DEFAULT_LOOKBACK_DAYS}d`
}

export async function parseGmailForUser(userId: string): Promise<ParseResult> {
  const result: ParseResult = { items: [], scanned: 0, skipped: 0, errors: 0, errorMessages: [] }

  const { data: user, error: userError } = await insforgeAdmin.database
    .from('users')
    .select('gmail_refresh_token, gmail_last_synced_at')
    .eq('id', userId)
    .single()
  if (userError || !user) throw new Error(`User not found: ${userId}`)
  if (!user.gmail_refresh_token) throw new Error('GMAIL_NOT_CONNECTED')

  const accessToken = await getAccessToken(userId)
  const query = buildQuery(user.gmail_last_synced_at)
  const refs = await listMessages(accessToken, query)
  result.scanned = refs.length

  for (const ref of refs) {
    try {
      if (await alreadyProcessed(ref.id)) { result.skipped++; continue }
      const msg = await getMessage(accessToken, ref.id)
      const fromHeader = msg.headers['from'] ?? ''
      const parser = getParserForSender(fromHeader)
      if (!parser) { result.skipped++; continue }

      const parsed = parser({
        subject: msg.headers['subject'] ?? '',
        bodyText: msg.bodyText,
        bodyHtml: msg.bodyHtml,
        receivedAt: new Date(Number(msg.internalDate)),
      })
      if (parsed.length === 0) { result.skipped++; continue }

      for (const p of parsed) {
        result.items.push({
          ...p,
          gmailMessageId: ref.id,
          rawFrom: fromHeader,
          rawSubject: msg.headers['subject'] ?? '',
          rawSnippet: msg.snippet,
        })
      }
    } catch (err) {
      result.errors++
      const m = err instanceof Error ? err.message : String(err)
      result.errorMessages.push(`${ref.id}: ${m}`)
    }
  }

  if (result.items.length > 0) {
    await insforgeAdmin.database
      .from('users')
      .update({ gmail_last_synced_at: new Date().toISOString() })
      .eq('id', userId)
  }
  return result
}

export async function commitParsedTransactions(userId: string, items: CommitInput[]): Promise<CommitResult> {
  const result: CommitResult = { created: 0, errors: [] }

  for (const item of items) {
    try {
      let accountId: string | null
      if (item.account_id !== undefined) {
        accountId = item.account_id
      } else {
        const account = item.lastFour ? await findAccountByLastFour(userId, item.lastFour) : null
        accountId = account?.id ?? null
      }

      const { data: created, error: insertError } = await insforgeAdmin.database
        .from('transactions')
        .insert([
          {
            user_id: userId,
            amount: item.amount,
            currency: item.currency,
            type: item.type,
            category_id: item.category_id,
            account_id: accountId,
            description: item.description,
            date: item.date,
            source: 'gmail',
            notes: `Gmail: ${item.matchedRule} (msg ${item.gmailMessageId})`,
          },
        ])
        .select('id')
        .single()

      if (insertError || !created) {
        throw new Error(`insert tx failed: ${JSON.stringify(insertError)}`)
      }

      if (accountId) {
        const { data: acc } = await insforgeAdmin.database
          .from('accounts')
          .select('currency')
          .eq('id', accountId)
          .maybeSingle()
        const direction = item.type === 'income' ? 'add' : 'subtract'
        await applyBalanceDelta(
          accountId,
          item.amount,
          (acc?.currency ?? item.currency) as typeof item.currency,
          direction
        )
      }

      await insforgeAdmin.database.from('processed_emails').insert([
        {
          gmail_message_id: item.gmailMessageId,
          user_id: userId,
          outcome: 'auto_registered',
          transaction_id: created.id,
        },
      ])

      result.created++
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err)
      result.errors.push(`${item.gmailMessageId}: ${m}`)
      await insforgeAdmin.database
        .from('processed_emails')
        .insert([{ gmail_message_id: item.gmailMessageId, user_id: userId, outcome: 'error', error_message: m.slice(0, 500) }])
        .then(() => undefined, () => undefined)
    }
  }

  return result
}

export async function autoCommitGmailForUser(userId: string): Promise<{ parse: ParseResult; commit: CommitResult }> {
  const parse = await parseGmailForUser(userId)
  const commitItems: CommitInput[] = parse.items.map((it) => ({ ...it, category_id: null }))
  const commit = await commitParsedTransactions(userId, commitItems)
  return { parse, commit }
}
