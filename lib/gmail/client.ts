import { decryptToken } from './tokens'
import { insforgeAdmin } from '../insforge-admin'

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

const accessTokenCache = new Map<string, CachedToken>()

export async function getAccessToken(userId: string): Promise<string> {
  const cached = accessTokenCache.get(userId)
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken
  }

  const { data: user, error } = await insforgeAdmin.database
    .from('users')
    .select('gmail_refresh_token')
    .eq('id', userId)
    .single()

  if (error || !user?.gmail_refresh_token) {
    throw new Error('GMAIL_NOT_CONNECTED')
  }

  const refreshToken = decryptToken(user.gmail_refresh_token)

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth env vars')
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`refresh_token exchange failed: ${res.status} ${body}`)
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  const expiresAt = Date.now() + json.expires_in * 1000
  accessTokenCache.set(userId, { accessToken: json.access_token, expiresAt })
  return json.access_token
}

export interface GmailMessageRef {
  id: string
  threadId: string
}

export async function listMessages(
  accessToken: string,
  query: string,
  maxResults = 50
): Promise<GmailMessageRef[]> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) })
  const res = await fetch(`${GMAIL_API}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`listMessages failed: ${res.status} ${body}`)
  }
  const json = (await res.json()) as { messages?: GmailMessageRef[] }
  return json.messages ?? []
}

export interface GmailMessage {
  id: string
  internalDate: string
  snippet: string
  headers: Record<string, string>
  bodyText: string
  bodyHtml: string
}

interface RawPart {
  mimeType?: string
  body?: { data?: string; size?: number }
  parts?: RawPart[]
}

interface RawMessage {
  id: string
  internalDate: string
  snippet: string
  payload: RawPart & { headers?: Array<{ name: string; value: string }> }
}

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function extractBodies(part: RawPart): { text: string; html: string } {
  let text = ''
  let html = ''

  const walk = (p: RawPart) => {
    if (p.body?.data) {
      const decoded = decodeBase64Url(p.body.data)
      if (p.mimeType === 'text/plain') text += decoded
      else if (p.mimeType === 'text/html') html += decoded
    }
    if (p.parts) p.parts.forEach(walk)
  }

  walk(part)
  return { text, html }
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const res = await fetch(`${GMAIL_API}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getMessage failed: ${res.status} ${body}`)
  }
  const raw = (await res.json()) as RawMessage
  const headers: Record<string, string> = {}
  for (const h of raw.payload.headers ?? []) {
    headers[h.name.toLowerCase()] = h.value
  }
  const { text, html } = extractBodies(raw.payload)
  return {
    id: raw.id,
    internalDate: raw.internalDate,
    snippet: raw.snippet,
    headers,
    bodyText: text,
    bodyHtml: html,
  }
}
