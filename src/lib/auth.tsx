import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AdminUser, AdminRole } from '@/types/admin'
import { ROLE_PERMISSIONS } from '@/types/admin'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('simmam_admin_user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed?.role === 'coordinator') {
          localStorage.removeItem('simmam_admin_user')
        } else {
          setUser(parsed)
        }
      } catch (error) {
        localStorage.removeItem('simmam_admin_user')
      }
    }
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
