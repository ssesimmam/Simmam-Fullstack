import { useEffect, useState } from 'react'
import { User, LogIn } from 'lucide-react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { UserDashboard } from '@/components/UserDashboard'
import { UserSetupModal } from '@/components/UserSetupModal'
import { getUser, saveUser, type UserProfile } from '@/lib/registrationStore'
import { fetchUserProfileByEmail } from '@/lib/apiClient'

export function ProfilePage() {
  const [user, setUser] = useState(getUser)
  const [syncingProfile, setSyncingProfile] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setShowSetupModal(params.get('signup') === '1')
  }, [location.search])

  useEffect(() => {
    if (!user?.email) {
      setSyncingProfile(false)
      return
    }

    let cancelled = false

    const syncProfile = async () => {
      setSyncingProfile(true)

      try {
        const result = await fetchUserProfileByEmail(user.email)
        if (cancelled || !result.user) {
          return
        }

        const syncedUser: UserProfile = {
          email: result.user.email.toLowerCase(),
          name: result.user.name || user.name,
          picture: result.user.picture_url || user.picture,
          registerNumber: result.user.register_number || user.registerNumber,
          mobileNumber: result.user.mobile_number || user.mobileNumber,
          house: result.user.house || user.house,
        }

        saveUser(syncedUser)
        setUser(syncedUser)
      } catch {
        // Keep the session-backed profile if the API is unavailable.
      } finally {
        if (!cancelled) {
          setSyncingProfile(false)
        }
      }
    }

    void syncProfile()

    return () => {
      cancelled = true
    }
  }, [user?.email])

  const refreshUser = () => {
    setUser(getUser())
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (!loginEmail.trim() || !/^[^\s@]+@saveetha\.com$/i.test(loginEmail.trim())) {
      setLoginError('Enter a valid @saveetha.com email address.')
      return
    }

    setLoggingIn(true)
    try {
      const result = await fetchUserProfileByEmail(loginEmail)
      if (!result.user) {
        setLoginError('No profile found. Please sign up first.')
        return
      }

      const profile: UserProfile = {
        email: result.user.email.toLowerCase(),
        name: result.user.name,
        picture: result.user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(result.user.name)}`,
        registerNumber: result.user.register_number || '',
        mobileNumber: result.user.mobile_number,
        house: result.user.house || '',
      }

      saveUser(profile)
      setUser(profile)
    } catch (error: any) {
      setLoginError(error?.message || 'Unable to log in right now.')
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main className="relative pt-32 pb-24 min-h-[80vh]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-[#D4AF37]/5 to-background" />
          <div className="absolute inset-0 grid-bg opacity-30" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-black text-white mb-3">
              User <span className="text-[#D4AF37]">Profile</span>
            </h1>
            <p className="text-white/50 text-sm tracking-wide">
              Manage your registrations, check-ins, and OD eligibility.
            </p>
          </div>

          {user ? (
            syncingProfile ? (
              <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 text-center text-sm text-white/50">
                Syncing profile from the database...
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <UserDashboard
                  user={user}
                  onSignOut={() => setUser(null)}
                />
              </div>
            )
          ) : (
            <div className="max-w-md mx-auto mt-16 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                <User className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-display">Login Required</h2>
              <p className="text-white/40 text-sm mb-8">
                Login with your Saveetha email to access your SIMMAM 2026 dashboard.
              </p>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="192421111.simats@saveetha.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
                  />
                </div>
                {loginError && <p className="text-xs text-red-400">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="inline-flex w-full items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[oklch(0.55_0.22_27)] to-[#D4AF37] text-black font-bold hover:scale-105 hover:shadow-[0_0_30px_#D4AF3740] transition-all disabled:opacity-60"
                >
                  <LogIn className="w-5 h-5" />
                  {loggingIn ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <div className="mt-4 text-sm text-white/40">
                New user?{' '}
                <Link to="/profile" search={{ signup: '1' }} className="text-[#D4AF37] hover:text-[#f3c95b]">
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showSetupModal && (
        <UserSetupModal
          onSave={refreshUser}
          onClose={() => {
            setShowSetupModal(false)
            void navigate({ to: '/profile', replace: true })
          }}
        />
      )}
    </div>
  )
}
