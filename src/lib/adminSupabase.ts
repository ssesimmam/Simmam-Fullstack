import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const adminSupabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: true,
  },
})

export default adminSupabase