import { createClient } from '@supabase/supabase-js'

if (typeof window !== 'undefined') {
  throw new Error('adminSupabase must not be imported in browser code. Use src/lib/supabase.ts instead.')
}

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Server-only admin client guard. This module must not be bundled into browser code.
const createServerSupabaseStub = () => {
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
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => queryBuilder,
    rpc: () => queryResult,
    channel: () => ({ unsubscribe: () => undefined }),
    removeChannel: async () => undefined,
  }
}

const createBrowserSupabase = () => {
  const globalForAdminSupabase = (globalThis as any) as { __simmam_admin_supabase?: any }
  return (globalForAdminSupabase.__simmam_admin_supabase ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: true,
    },
  }))
}

export const adminSupabase = createServerSupabaseStub()

export default adminSupabase