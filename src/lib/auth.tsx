import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AdminUser, AdminRole } from '@/types/admin'
import { ROLE_PERMISSIONS, ROUTE_PERMISSIONS } from '@/types/admin'
import supabase from '@/lib/supabase'

interface AuthContextType {
  user: AdminUser | null
  login: (email: string, role: AdminRole) => Promise<boolean>
  logout: () => void
  hasPermission: (resource: string, action: string) => boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Storage Helpers (useEffect-only, never during render) ───────────────────

export function getStoredAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem('simmam_admin_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Deny coordinator role (legacy cleanup)
    if (parsed?.role === 'coordinator') {
      localStorage.removeItem('simmam_admin_user')
      return null
    }
    return parsed as AdminUser
  } catch {
    localStorage.removeItem('simmam_admin_user')
    return null
  }
}

export function getStoredAdminAccessToken(): string | null {
  const token = localStorage.getItem('simmam_admin_access_token')
  return token?.trim() || null
}

// ─── Authorization Helpers ────────────────────────────────────────────────────

export function canAccessAdminPath(user: AdminUser | null | undefined, pathname: string): boolean {
  if (!user) return false
  const permissions = ROLE_PERMISSIONS[user.role] || []
  if (pathname === '/wch1925' || pathname === '/wch1925/') {
    return user.role === 'developer_admin' || user.role === 'core_team' || user.role === 'reg_team'
  }
  const normalized = pathname.replace(/\/$/, '')
  return Object.entries(ROUTE_PERMISSIONS || {}).some(([routePath, requiredPermissions]) => {
    if (routePath !== normalized) return false
    return requiredPermissions.every((perm) =>
      permissions.some((entry) => entry.resource === perm.resource && perm.actions.every((a) => entry.actions.includes(a)))
    )
  })
}

export function getDefaultAdminPath(user: AdminUser | null | undefined): string {
  if (!user) return '/wch1925/login'
  if (user.role === 'reg_team') return '/wch1925/checkin'
  return '/wch1925'
}

export function getAuthorizedAdminRedirect(user: AdminUser | null | undefined, requestedPath?: string | null): string {
  if (requestedPath && canAccessAdminPath(user, requestedPath)) return requestedPath
  return getDefaultAdminPath(user)
}

// ─── Auth Provider ────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const storedUser = getStoredAdminUser()

        if (mounted) {
          if (!session) {
            setUser(null)
            localStorage.removeItem('simmam_admin_user')
            localStorage.removeItem('simmam_admin_access_token')
          } else if (storedUser) {
            setUser(storedUser)
          }
          setIsLoading(false)
        }
      } catch {
        if (mounted) setIsLoading(false)
      }
    }

    void initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('simmam_admin_user')
        localStorage.removeItem('simmam_admin_access_token')

        if (window.location.pathname.startsWith('/wch1925') && window.location.pathname !== '/wch1925/login') {
          window.location.href = '/wch1925/login'
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (!session) {
          setUser(null)
          localStorage.removeItem('simmam_admin_user')
          localStorage.removeItem('simmam_admin_access_token')
        } else {
          const storedUser = getStoredAdminUser()
          if (storedUser) setUser(storedUser)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, role: AdminRole): Promise<boolean> => {
    const normalizedEmail = String(email ?? '').trim().toLowerCase()
    if (!normalizedEmail || !role) return false

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return false

      const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
      const base = apiUrl ? apiUrl.replace(/\/$/, '') : ''
      const response = await fetch(`${base}/api/wch1925/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: normalizedEmail, role }),
      })

      if (!response.ok) return false

      const result = await response.json()
      const adminUser = result?.user as AdminUser | undefined
      if (!adminUser?.email || !adminUser?.role) return false

      setUser(adminUser)
      localStorage.setItem('simmam_admin_user', JSON.stringify(adminUser))
      localStorage.setItem('simmam_admin_access_token', token)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('simmam_admin_user')
    localStorage.removeItem('simmam_admin_access_token')
    localStorage.removeItem('simmam_admin_google_signin')
    void supabase.auth.signOut().catch(() => {})
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    const permissions = ROLE_PERMISSIONS[user.role] || []
    return permissions.some((perm) => perm.resource === resource && perm.actions.includes(action))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      login: async () => false,
      logout: () => {},
      hasPermission: () => false,
      isLoading: true,
    } as unknown as AuthContextType
  }
  return context
}
