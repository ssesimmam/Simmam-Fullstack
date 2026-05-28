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

    // Force a round-trip to re-establish session after OAuth redirect before cache hydrates
    await supabase.auth.getUser().catch(() => null)
    const refreshed = (await supabase.auth.getSession()).data.session
    if (refreshed?.access_token) return { Authorization: `Bearer ${refreshed.access_token}` }

    return {}
  } catch {
    return {}
  }
}

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) return { Authorization: `Bearer ${token}` }

    // Fallback: check stored admin token
    const stored = localStorage.getItem('simmam_admin_access_token')
    if (stored?.trim()) return { Authorization: `Bearer ${stored.trim()}` }

    await supabase.auth.getUser().catch(() => null)
    const refreshed = (await supabase.auth.getSession()).data.session
    if (refreshed?.access_token) return { Authorization: `Bearer ${refreshed.access_token}` }

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
