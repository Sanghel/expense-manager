import { createClient } from '@insforge/sdk'

// Do NOT throw here at module level — Next.js evaluates imports during the
// build's "Collecting page data" phase before runtime env vars are injected.
export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? '',
})

export async function testInsforgeConnection() {
  try {
    const { error } = await insforge.database.from('users').select('id').limit(1)
    if (error) throw error
    return true
  } catch (error) {
    console.error('InsForge connection failed:', error)
    return false
  }
}
