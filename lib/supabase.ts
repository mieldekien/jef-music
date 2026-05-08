import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured =
  SUPABASE_URL.startsWith('https://') && SUPABASE_KEY.length > 20

export function createClient() {
  if (!supabaseConfigured) {
    // Return a dummy client that never throws — real auth needs .env.local filled in
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
    )
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
