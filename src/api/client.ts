import supabase from '@/lib/supabase'

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Status codes that should render the maintenance screen instead of a field error. */
const MAINTENANCE_CODES = new Set([400, 401, 402, 403, 404, 405, 429, 500, 501, 502])

export function isMaintenanceError(error: unknown): error is ApiError {
  return error instanceof ApiError && MAINTENANCE_CODES.has(error.status)
}

// ─── Base URL Resolution ──────────────────────────────────────────────────────

function resolveBase(suffix: string): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (!raw) return suffix
  const normalized = raw.replace(/\/$/, '')
  if (normalized.endsWith(suffix)) return normalized
  return `${normalized}${suffix}`
}

export const apiBase = resolveBase('/api')
export const adminBase = resolveBase('/api/wch1925')

// ─── Auth Header Helpers ──────────────────────────────────────────────────────

export async function getUserAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) return { Authorization: `Bearer ${token}` }

    // Try localStorage fallback if the SDK session has not hydrated yet.
    const fallback = getAccessTokenFromLocalStorage()
    if (fallback) return { Authorization: `Bearer ${fallback}` }

    return {}
  } catch {
    const fallback = getAccessTokenFromLocalStorage()
    if (fallback) return { Authorization: `Bearer ${fallback}` }
    return {}
  }
}

// Fallback helper: try to read an access token from localStorage if SDK
// session resolution fails (helps during early page load/hydration races).
function getAccessTokenFromLocalStorage(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null

    // Common Supabase keys used by different versions
    const candidates = [
      'supabase.auth.token',
      'sb:token',
      'supabase.auth.session',
    ]

    for (const key of candidates) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        // Various shapes: { currentSession: { access_token } } or { access_token }
        if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token
        if (parsed?.persistedSession?.access_token) return parsed.persistedSession.access_token
        if (parsed?.access_token) return parsed.access_token
        // Some clients persist an object with 'currentSession' nested differently
        if (parsed?.currentSession?.provider_token) return parsed.currentSession.provider_token
      } catch {
        // raw string may itself be the token
        if (raw && raw.length > 20 && raw.includes('.')) return raw
      }
    }

    // Generic scan: try parse any localStorage value that looks like a session
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.access_token) return parsed.access_token
        if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token
      } catch {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }

  return null
}

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) return { Authorization: `Bearer ${token}` }

    // Fallback: check stored admin token
    const stored = localStorage.getItem('simmam_admin_access_token')
    if (stored?.trim()) return { Authorization: `Bearer ${stored.trim()}` }

    const refreshedStored = localStorage.getItem('simmam_admin_access_token')
    if (refreshedStored?.trim()) return { Authorization: `Bearer ${refreshedStored.trim()}` }

    return {}
  } catch {
    return {}
  }
}

// ─── Core Request Helpers ─────────────────────────────────────────────────────

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}

export async function request<T>(base: string, path: string, init?: RequestInit, authHeaders?: Record<string, string>): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeaders ?? {}),
      ...(init?.headers ?? {}),
    },
  })

  // Support CSV responses from admin export endpoints
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return (await response.text()) as unknown as T
  }

  const payload = await parseResponse(response)

  if (!response.ok) {
    const msg = (payload as any)?.error || (payload as any)?.message || `Request failed (${response.status})`
    throw new ApiError(msg, response.status)
  }

  return payload as T
}

/** Public API request (user auth token) */
export async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getUserAuthHeaders()
  return request<T>(apiBase, path, init, headers)
}

/** Admin API request (admin auth token, /api/wch1925 prefix) */
export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAdminAuthHeaders()
  return request<T>(adminBase, path, init, headers)
}
