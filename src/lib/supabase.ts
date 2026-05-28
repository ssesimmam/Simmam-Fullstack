import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || url.includes('your-project.supabase.co')) {
  throw new Error('FATAL: Invalid VITE_SUPABASE_URL configuration')
}

if (
  !anonKey ||
  anonKey.trim() === '' ||
  anonKey.includes('REAL_') ||
  anonKey.includes('your-supabase')
) {
  throw new Error(
    'FATAL: Invalid Supabase anon key'
  )
}

const createServerSupabaseStub = () => {
  const emptyAuthResult = { data: { session: null, user: null }, error: null }
  const emptyUserResult = { data: { user: null }, error: null }
  const emptySessionResult = { data: { session: null }, error: null }
  const queryResult = Promise.resolve({ data: null, error: null })

  const queryBuilder: any = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'then') {
          return queryResult.then.bind(queryResult)
        }

        if (property === 'single' || property === 'maybeSingle' || property === 'select' || property === 'insert' || property === 'update' || property === 'upsert' || property === 'delete' || property === 'eq' || property === 'in' || property === 'order' || property === 'range' || property === 'limit' || property === 'gte' || property === 'lte' || property === 'ilike') {
          return () => queryBuilder
        }

        return () => queryBuilder
      },
    },
  )

  return {
    auth: {
      getSession: async () => emptySessionResult,
      getUser: async () => emptyUserResult,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ data: null, error: new Error('Supabase auth is not available during SSR') }),
      refreshSession: async () => emptySessionResult,
    },
    from: () => queryBuilder,
    rpc: () => queryResult,
    channel: () => ({ unsubscribe: () => undefined }),
    removeChannel: async () => undefined,
  }
}

const createBrowserSupabase = () => {
  const globalForSupabase = (globalThis as any) as { __simmam_supabase?: any }
  return (globalForSupabase.__simmam_supabase ??= createClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }))
}

export const supabase = typeof window === 'undefined' ? createServerSupabaseStub() : createBrowserSupabase()

export default supabase