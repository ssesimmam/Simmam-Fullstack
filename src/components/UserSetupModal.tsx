import { useState } from 'react'
import { ArrowRight, Hash, Mail, Shield, User, X } from 'lucide-react'
import { getUser, saveUser, type UserProfile } from '@/lib/registrationStore'
import { useData } from '@/lib/store'

interface UserSetupModalProps {
  onSave: () => void
  onClose: () => void
}

export function UserSetupModal({ onSave, onClose }: UserSetupModalProps) {
  const { houses } = useData()
  const existing = getUser()

  const [formName, setFormName] = useState(existing?.name ?? '')
  const [formRegNo, setFormRegNo] = useState(existing?.registerNumber ?? '')
  const [formMobile, setFormMobile] = useState(existing?.mobileNumber ?? '')
  const [formEmail, setFormEmail] = useState(existing?.email ?? '')
  const [formHouse, setFormHouse] = useState(existing?.house ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formName.trim()) { setError('Full name is required.'); return }
    if (!formRegNo.trim()) { setError('Register number is required.'); return }
    if (!formMobile.trim()) { setError('Mobile number is required.'); return }
    if (!/^\d{10}$/.test(formMobile.trim())) { setError('Mobile number must be 10 digits.'); return }
    if (!formEmail.trim() || !/^[^\s@]+@saveetha\.com$/i.test(formEmail.trim())) { setError('Email must end with @saveetha.com.'); return }
    if (!formHouse) { setError('Please select your house.'); return }

    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))

    const user: UserProfile = {
      email: formEmail.trim().toLowerCase(),
      name: formName.trim(),
      picture: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(formName.trim())}`,
      registerNumber: formRegNo.trim().toUpperCase(),
      mobileNumber: formMobile.trim(),
      house: formHouse,
    }

    saveUser(user)
    setSubmitting(false)
    onSave()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="User profile setup"
      >
        <div
          className="relative w-full max-w-lg animate-rise-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow orbs */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-20"
            style={{ background: '#D4AF37' }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-15"
            style={{ background: 'oklch(0.55 0.22 27)' }}
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            {/* Gold accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[oklch(0.55_0.22_27)] via-[#D4AF37] to-[oklch(0.55_0.22_27)]" />

            {/* Close button */}
            <button
              onClick={onClose}
              id="user-setup-close-btn"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="font-display text-xl font-bold text-white">
                  {existing ? 'Edit Profile' : 'Set Up Your Profile'}
                </h2>
              </div>
              <p className="mb-6 text-sm text-white/45">
                {existing
                  ? 'Update your details below.'
                  : 'Enter your details once to unlock your full SIMMAM 2026 dashboard.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                      id="setup-name"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-12 text-sm text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
                    />
                  </div>
                </div>

                {/* Register Number */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Register Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                      id="setup-regno"
                      type="text"
                      value={formRegNo}
                      onChange={(e) => setFormRegNo(e.target.value)}
                      placeholder="e.g. 192421111"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-12 text-sm uppercase text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                      id="setup-mobile"
                      type="tel"
                      inputMode="numeric"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-12 text-sm text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
                    />
                  </div>
                </div>

                {/* SIMATS Email */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Saveetha Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                      id="setup-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="192421111.simats@saveetha.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-12 text-sm text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-white/30">Only `@saveetha.com` addresses are accepted.</p>
                </div>

                {/* House Selection */}
                <div>
                  <label className="mb-3 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Select Your House
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {houses.map((house) => {
                      const isSelected = formHouse === house.name
                      return (
                        <button
                          key={house.name}
                          type="button"
                          id={`house-btn-${house.name.toLowerCase()}`}
                          onClick={() => setFormHouse(house.name)}
                          className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-200 ${
                            isSelected
                              ? 'shadow-lg scale-[1.02]'
                              : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                          }`}
                          style={
                            isSelected
                              ? {
                                  borderColor: house.accent,
                                  backgroundColor: `${house.accent}18`,
                                  boxShadow: `0 0 18px ${house.accent}30`,
                                }
                              : {}
                          }
                        >
                          {/* House logo */}
                          <img
                            src={house.logo}
                            alt={house.name}
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <span
                            className="text-xs font-bold tracking-wide"
                            style={{ color: isSelected ? house.accent : 'rgba(255,255,255,0.55)' }}
                          >
                            {house.name}
                          </span>
                          <span
                            className="text-[9px] tracking-widest"
                            style={{ color: isSelected ? `${house.accent}99` : 'rgba(255,255,255,0.25)' }}
                          >
                            {house.short}
                          </span>
                          {isSelected && (
                            <div
                              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-black"
                              style={{ backgroundColor: house.accent }}
                            >
                              ✓
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  id="setup-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.55_0.22_27)] to-[#D4AF37] py-3.5 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_#D4AF3760] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {existing ? 'Update Profile' : 'Save & Continue'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
