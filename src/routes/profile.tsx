import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { User, LogIn } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { UserDashboard } from '@/components/UserDashboard'
import { UserSetupModal } from '@/components/UserSetupModal'
import { getUser } from '@/lib/registrationStore'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const [user, setUser] = useState(getUser)
  const [showSetupModal, setShowSetupModal] = useState(false)

  const refreshUser = () => {
    setUser(getUser())
  }

  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      
      <main className="relative pt-32 pb-24 min-h-[80vh]">
        {/* Background effects matching global style */}
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UserDashboard
                user={user}
                onEditProfile={() => setShowSetupModal(true)}
                onSignOut={() => setUser(null)}
              />
            </div>
          ) : (
            <div className="max-w-md mx-auto mt-16 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                <User className="h-10 w-10 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-display">Not Signed In</h2>
              <p className="text-white/40 text-sm mb-8">
                Set up your profile once to access your full SIMMAM 2026 dashboard.
              </p>
              <button
                onClick={() => setShowSetupModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[oklch(0.55_0.22_27)] to-[#D4AF37] text-black font-bold hover:scale-105 hover:shadow-[0_0_30px_#D4AF3740] transition-all"
              >
                <LogIn className="w-5 h-5" />
                Set Up Profile & Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {showSetupModal && (
        <UserSetupModal
          onSave={refreshUser}
          onClose={() => setShowSetupModal(false)}
        />
      )}
    </div>
  )
}
