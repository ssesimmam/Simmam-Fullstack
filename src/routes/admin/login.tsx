import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, Mail, UserCircle2 } from 'lucide-react'

import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminRole } from '@/types/admin'

const SAMPLE_ADMIN_ACCOUNTS: Record<AdminRole, string> = {
  developer_admin: 'dev@s.com',
  core_team: 'core@s.com',
  reg_team: 'reg@s.com',
}

export const Route = createFileRoute('/admin/login')({
  beforeLoad: ({ context }: { context: any }) => {
    if (context.auth?.user) {
      throw redirect({
        to: '/admin',
        replace: true,
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [profile, setProfile] = useState<AdminRole | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!profile) {
      setError('Please select a user profile.')
      setIsLoading(false)
      return
    }

    try {
      const success = await login(email, password, profile)
      if (!success) {
        setError('Invalid email, password, or profile')
      } else {
        navigate({ to: '/admin', replace: true })
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#111] border border-[#333] rounded-xl p-8">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-white tracking-widest">
                SIMMAM
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Admin Control Center
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@simmam.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile">User Profile</Label>
                <div className="relative">
                  <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Select
                    value={profile}
                    onValueChange={(value) => {
                      const selectedRole = value as AdminRole
                      setProfile(selectedRole)
                      if (!email) {
                        setEmail(SAMPLE_ADMIN_ACCOUNTS[selectedRole])
                      }
                    }}
                  >
                    <SelectTrigger id="profile" className="pl-10">
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer_admin">Developer Admin</SelectItem>
                      <SelectItem value="core_team">Core Team</SelectItem>
                      <SelectItem value="reg_team">Registration Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-gray-600 bg-[#222] p-3 text-sm text-white">
                  {error}
                </div>
              )}

              <div className="rounded-lg border border-[#333] bg-black p-4 text-sm text-gray-400">
                <p className="font-semibold text-white">Developer mock login</p>
                <p className="mt-1">Use one of the sample accounts and password <span className="font-medium text-white">admin123</span>.</p>
                <ul className="mt-3 space-y-1 text-xs">
                  <li><span className="font-medium text-white">Developer Admin:</span> dev@s.com</li>
                  <li><span className="font-medium text-white">Core Team:</span> core@s.com</li>
                  <li><span className="font-medium text-white">Registration Team:</span> reg@s.com</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-gray-200 rounded-md font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}