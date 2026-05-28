import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || url.includes('your-project.supabase.co')) {
  throw new Error('FATAL: Invalid VITE_SUPABASE_URL configuration')
}

if (!anonKey || anonKey.trim() === '' || anonKey.includes('REAL_') || anonKey.includes('your-supabase')) {
  throw new Error('FATAL: Invalid Supabase anon key')
}

// Pure CSR Supabase client — no SSR stub, no typeof window checks.
// This module is only ever loaded in the browser.
const supabase = createClient(url, anonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export { supabase }
export default supabase