import { useState, useEffect } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Mail } from 'lucide-react'

import { useAuth, getAuthorizedAdminRedirect, getStoredAdminUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import adminSupabase from '@/lib/adminSupabase'

export const Route = createFileRoute('/admin/login')({
  beforeLoad: ({ location }) => {
    const storedUser = getStoredAdminUser()
    if (storedUser) {
      throw redirect({
        to: getAuthorizedAdminRedirect(storedUser, location.search?.redirectTo),
        replace: true,
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch() as { redirectTo?: string }
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const handleSession = async (session: any) => {
      if (!mounted) return
      const pending = window.localStorage.getItem('simmam_admin_google_signin')
      if (!pending) return

      setAuthLoading(true)
      setError('')

      try {
        const emailFromSession = session?.user?.email?.toLowerCase()
        if (!emailFromSession) {
          window.localStorage.removeItem('simmam_admin_google_signin')
          setError('Unable to detect Google account email.')
          return
        }

        const success = await login(emailFromSession)
        if (!success) {
          window.localStorage.removeItem('simmam_admin_google_signin')
          await adminSupabase.auth.signOut()
          setError('This Google account is not authorized for admin access.')
          return
        }

        window.localStorage.removeItem('simmam_admin_google_signin')
        const storedUser = getStoredAdminUser()
        navigate({
          to: getAuthorizedAdminRedirect(storedUser, search.redirectTo),
          replace: true,
        })
      } catch (err: any) {
        window.localStorage.removeItem('simmam_admin_google_signin')
        setError(err?.message || 'Google sign-in failed. Please try again.')
      } finally {
        if (mounted) setAuthLoading(false)
      }
    }

    let authSubscription: { subscription: { unsubscribe: () => void } } | null = null

    const init = async () => {
      try {
        const { data: sessionData } = await adminSupabase.auth.getSession()
        if (sessionData?.session) {
          await handleSession(sessionData.session)
        }
      } catch {
        // ignore
      }

      const { data } = adminSupabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          void handleSession(session)
        }
      })
      authSubscription = data
    }

    void init()

    return () => {
      mounted = false
      try {
        authSubscription?.subscription.unsubscribe()
      } catch {
        // ignore unsubscribe errors
      }
    }
  }, [login, navigate, search.redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!email.trim()) {
      setError('Please enter your admin email address.')
      setIsLoading(false)
      return
    }

    try {
      const success = await login(email)
      if (!success) {
        setError('This email is not authorized for admin access.')
      } else {
        const storedUser = getStoredAdminUser()
        navigate({
          to: getAuthorizedAdminRedirect(storedUser, search.redirectTo),
          replace: true,
        })
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setAuthLoading(true)
    window.localStorage.setItem('simmam_admin_google_signin', '1')

    try {
      const { error: authError } = await adminSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/login`,
        },
      })
      if (authError) {
        window.localStorage.removeItem('simmam_admin_google_signin')
        setError(authError.message || 'Unable to start Google authentication.')
      }
    } catch (err: any) {
      window.localStorage.removeItem('simmam_admin_google_signin')
      setError(err?.message || 'Unable to start Google authentication.')
    } finally {
      setAuthLoading(false)
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
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                  <p className="font-semibold text-white">Admin access only</p>
                  <p className="mt-1 text-xs text-gray-400">Use a permitted Google account or enter your approved admin email.</p>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-gray-600 bg-[#222] p-3 text-sm text-white">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 disabled:opacity-60"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.9 0 7.2 1.4 9.7 3.6l7.1-7.1C36.5 2.2 30.6 0 24 0 14.7 0 6.8 5.2 2.9 12.7l8.3 6.4C12.9 14.2 18.1 9.5 24 9.5z" />
                  <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.6 3.2-2.6 5.8-5.5 7.6l8.4 6.5C43.5 39.1 46.5 32.4 46.5 24.5z" />
                  <path fill="#4A90E2" d="M10.3 29.1A14.9 14.9 0 0 1 9 24.5c0-1.6.3-3.1.8-4.6L2.9 13.6A24 24 0 0 0 0 24.5c0 3.8.9 7.3 2.9 10.6l7.4-6z" />
                  <path fill="#FBBC05" d="M24 48c6.6 0 12.5-2.2 17.2-6l-8.4-6.5c-2.6 1.8-5.9 2.8-8.8 2.8-5.9 0-11.1-4.7-12.8-11.1L2.9 35.3C6.8 42.7 14.7 48 24 48z" />
                </svg>
                {authLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/35">
                <span className="h-px flex-1 bg-white/10" />
                <span>or use email</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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