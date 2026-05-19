import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AdminUser, AdminRole } from '@/types/admin'
import { ROLE_PERMISSIONS, ROUTE_PERMISSIONS } from '@/types/admin'

// Mock users for development - in production, this would come from an API
const MOCK_USERS: AdminUser[] = [
  {
    id: '1',
    name: 'Registration Team',
    email: 'reg@s.com',
    role: 'reg_team',
  },
  {
    id: '2',
    name: 'Core Team Member',
    email: 'core@s.com',
    role: 'core_team',
  },
  {
    id: '3',
    name: 'Developer Admin',
    email: 'dev@s.com',
    role: 'developer_admin',
  },
]

interface AuthContextType {
  user: AdminUser | null
  login: (email: string, password: string, profile?: AdminRole) => Promise<boolean>
  logout: () => void
  hasPermission: (resource: string, action: string) => boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null

  const storedUser = localStorage.getItem('simmam_admin_user')
  if (!storedUser) return null

  try {
    const parsed = JSON.parse(storedUser)
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

export function canAccessAdminPath(user: AdminUser | null | undefined, pathname: string): boolean {
  if (!user) return false

  const permissions = ROLE_PERMISSIONS[user.role] || []

  if (pathname === '/admin' || pathname === '/admin/') {
    return user.role === 'developer_admin' || user.role === 'core_team' || user.role === 'reg_team'
  }

  const normalizedPath = pathname.replace(/\/$/, '')
  const allowed = Object.entries(ROUTE_PERMISSIONS || {})
  return allowed.some(([routePath, requiredPermissions]) => {
    if (routePath !== normalizedPath) return false
    return requiredPermissions.every((permission) =>
      permissions.some((entry) => entry.resource === permission.resource && permission.actions.every((action) => entry.actions.includes(action))),
    )
  })
}

export function getDefaultAdminPath(user: AdminUser | null | undefined): string {
  if (!user) return '/admin'
  if (user.role === 'reg_team') return '/admin/checkin'
  return '/admin'
}

export function getAuthorizedAdminRedirect(user: AdminUser | null | undefined, requestedPath?: string | null): string {
  if (requestedPath && canAccessAdminPath(user, requestedPath)) {
    return requestedPath
  }

  return getDefaultAdminPath(user)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = getStoredAdminUser()
    if (storedUser) setUser(storedUser)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, profile?: AdminRole): Promise<boolean> => {
    // Mock authentication - in production, this would be an API call
    const normalizedEmail = email.trim().toLowerCase()
    const mockUser = MOCK_USERS.find((entry) => entry.email.toLowerCase() === normalizedEmail)
    if (!mockUser) return false

    const passwordValid = password === 'admin123' // TODO: replace with API + bcrypt validation
    const profileValid = profile ? mockUser.role === profile : true

    if (passwordValid && profileValid) {
      setUser(mockUser)
      localStorage.setItem('simmam_admin_user', JSON.stringify(mockUser))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('simmam_admin_user')
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false

    const permissions = ROLE_PERMISSIONS[user.role] || []

    return permissions.some(perm =>
      perm.resource === resource && perm.actions.includes(action)
    )
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
