import { createClient } from '@insforge/sdk'

// Do NOT throw here at module level — Next.js evaluates imports during the
// build's "Collecting page data" phase before runtime env vars are injected.
// Missing key errors will surface naturally from the SDK at runtime.
export const insforgeAdmin = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL ?? '',
  anonKey: process.env.INSFORGE_API_KEY ?? '',
})
