import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import supabase from '@/lib/supabase'
import { fetchUserProfileByEmail } from '@/lib/apiClient'
import { saveUser, syncUserRegistrations, type UserProfile } from '@/lib/registrationStore'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const processSession = async () => {
      try {
        // Exchange code/tokens securely via Supabase PKCE flow
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        const user = sessionData?.session?.user
        if (user?.email) {
          const userProfile = await fetchUserProfileByEmail(user.email.toLowerCase())
          if (userProfile) {
            const newUser: UserProfile = {
              email: userProfile.email.toLowerCase(),
              name: userProfile.name,
              picture: userProfile.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`,
              registerNumber: userProfile.register_number || '',
              mobileNumber: userProfile.mobile_number,
              department: userProfile.department || '',
              house: userProfile.house || '',
            }
            await saveUser(newUser)
            try {
              await syncUserRegistrations(newUser.email)
            } catch {
              // ignore sync failure
            }
          }
        }

        // Safely strip auth tokens from URL avoiding any history leaks
        window.history.replaceState({}, document.title, window.location.pathname)

        if (!mounted) return

        // Read intent
        const intentStr = window.sessionStorage.getItem('simmam_oauth_intent')
        let intent = { source: 'public', redirectTo: '/profile' }
        if (intentStr) {
          try {
            intent = JSON.parse(intentStr)
          } catch {}
          window.sessionStorage.removeItem('simmam_oauth_intent')
        }

        // Navigate safely to intended destination
        navigate({ to: intent.redirectTo, replace: true })

      } catch (err: any) {
        if (!mounted) return

        setError(err.message || 'Authentication failed. Please try again.')

        // Safely strip auth tokens from URL even on failure
        window.history.replaceState({}, document.title, window.location.pathname)

        // Read intent for failure fallback
        const intentStr = window.sessionStorage.getItem('simmam_oauth_intent')
        let intent = { source: 'public', redirectTo: '/profile' }
        if (intentStr) {
          try {
            intent = JSON.parse(intentStr)
          } catch {}
          window.sessionStorage.removeItem('simmam_oauth_intent')
        }

        // Determine correct fallback based on architecture roles
        const fallback = intent.source === 'admin' ? '/wch1925/login' : '/profile'

        setTimeout(() => {
          if (mounted) navigate({ to: fallback, replace: true })
        }, 3000)
      }
    }

    void processSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="text-center max-w-md w-full">
        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-[#110000] p-6 text-red-400">
            <h2 className="text-xl font-display font-bold mb-2">Authentication Error</h2>
            <p className="text-sm">{error}</p>
            <p className="text-xs opacity-70 mt-4">Redirecting you back...</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#111] p-8 flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#D4AF37] mb-6" />
            <h2 className="text-lg font-display font-bold text-white mb-2">Authenticating</h2>
            <p className="text-sm text-white/50">Securely establishing your session...</p>
          </div>
        )}
      </div>
    </div>
  )
}
