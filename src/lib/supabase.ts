import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Guard client creation to avoid duplicate GoTrueClient instances during HMR
const globalForSupabase = (globalThis as any) as { __simmam_supabase?: any }
export const supabase = globalForSupabase.__simmam_supabase ??= createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export default supabase