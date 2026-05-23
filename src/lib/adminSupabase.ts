import { createClient } from '@supabase/supabase-js'

if (typeof window !== 'undefined') {
  throw new Error('adminSupabase must not be imported in browser code. Use src/lib/supabase.ts instead.')
}

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Server-only admin client guard. This module must not be bundled into browser code.
const globalForAdminSupabase = (globalThis as any) as { __simmam_admin_supabase?: any }
export const adminSupabase = globalForAdminSupabase.__simmam_admin_supabase ??= createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: true,
  },
})

export default adminSupabase