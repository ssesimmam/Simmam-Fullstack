import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // Do not throw in code; runtime will fail gracefully if env missing.
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export default supabase
