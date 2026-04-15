import { createClient } from '@insforge/sdk'

if (!process.env.INSFORGE_API_KEY) {
  throw new Error('Missing env.INSFORGE_API_KEY')
}

/**
 * Admin InsForge client — uses the full-access API key.
 * Bypasses RLS policies. Only use server-side (no NEXT_PUBLIC_ prefix).
 */
export const insforgeAdmin = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.INSFORGE_API_KEY,
})
