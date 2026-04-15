import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_INSFORGE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_INSFORGE_URL')
}
if (!process.env.INSFORGE_API_KEY) {
  throw new Error('Missing env.INSFORGE_API_KEY')
}

export const insforge = createClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL,
  process.env.INSFORGE_API_KEY,
  {
    auth: {
      persistSession: false, // NextAuth maneja la sesión
    },
  }
)

// Helper para verificar conexión
export async function testInsforgeConnection() {
  try {
    const { error } = await insforge.from('users').select('count').single()
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = tabla no existe aún (esperado)
      throw error
    }
    return true
  } catch (error) {
    console.error('InsForge connection failed:', error)
    return false
  }
}
