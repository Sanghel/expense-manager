import { createClient } from '@insforge/sdk'

if (!process.env.NEXT_PUBLIC_INSFORGE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_INSFORGE_URL')
}
if (!process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_INSFORGE_ANON_KEY')
}

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
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
