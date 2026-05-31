import { useState, useEffect } from 'react'
import { ArrowRight, Hash, Mail, Shield, User, X } from 'lucide-react'
import { getUser, saveUser, type UserProfile } from '@/lib/registrationStore'
import { useHouses } from '@/features/events/useEvents'
import { getDepartmentsForHouse } from '@/lib/houseDepartments'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const HOUSE_EXTRAS: Record<string, { short: string }> = {
  'Agniyas': { short: 'AG' },
  'Dronas': { short: 'DR' },
  'Marutas': { short: 'MA' },
  'Rudras': { short: 'RU' },
  'Suryas': { short: 'SU' },
  'Vajras': { short: 'VA' },
}

interface UserSetupModalProps {
  onSave: () => void
  onClose: () => void
  preventDismiss?: boolean
}

export function UserSetupModal({ onSave, onClose, preventDismiss = false }: UserSetupModalProps) {
  const { data: dbHouses = [] } = useHouses()
  const houses = dbHouses.map(h => ({
    ...h,
    short: HOUSE_EXTRAS[h.name]?.short || h.name.substring(0, 2).toUpperCase(),
  }))

  // Do not access sessionStorage during render. Hydrate on mount.
  const [formName, setFormName] = useState('')
  const [formRegNo, setFormRegNo] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formDepartment, setFormDepartment] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formHouse, setFormHouse] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Hydrate form values from stored profile on client mount
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null)
  useEffect(() => {
    try {
      const existing = getUser()
      if (existing) {
        setExistingProfile(existing)
        setFormName(existing.name ?? '')
        setFormRegNo(existing.registerNumber ?? '')
        setFormMobile(existing.mobileNumber ?? '')
        setFormDepartment(existing.department ?? '')
        setFormEmail(existing.email ?? '')
        setFormHouse(existing.house ?? '')
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const allowedDepartments = getDepartmentsForHouse(formHouse)
    if (formDepartment && !allowedDepartments.includes(formDepartment)) {
      setFormDepartment('')
    }
  }, [formDepartment, formHouse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formName.trim()) { setError('Full name is required.'); return }
    if (!formRegNo.trim()) { setError('Register number is required.'); return }
    if (!formMobile.trim()) { setError('Mobile number is required.'); return }
    if (!/^\d{10}$/.test(formMobile.trim())) { setError('Mobile number must be 10 digits.'); return }
    if (!formEmail.trim() || !/^[^\s@]+@saveetha\.com$/i.test(formEmail.trim())) { setError('Email must end with @saveetha.com.'); return }
    if (!formHouse) { setError('Please select your house.'); return }

    const allowedDepartments = getDepartmentsForHouse(formHouse)
    if (formDepartment && !allowedDepartments.includes(formDepartment)) {
      setError('Please select a valid department for your house.')
      return
    }

    setSubmitting(true)
    const normalizedEmail = formEmail.trim().toLowerCase()

    try {
      const user: UserProfile = {
        email: normalizedEmail,
        name: formName.trim(),
        picture: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(formName.trim())}`,
        registerNumber: formRegNo.trim().toUpperCase(),
        mobileNumber: formMobile.trim().replace(/\D/g, ''),
        department: formDepartment.trim(),
        house: formHouse,
      }

      await saveUser(user)
      toast.success(existingProfile ? 'Profile updated successfully' : 'Sign up successful')
      onSave()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
        onClick={preventDismiss ? undefined : onClose}
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
            {!preventDismiss && (
              <button
                onClick={onClose}
                id="user-setup-close-btn"
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="font-display text-xl font-bold text-white">
                  {existingProfile ? 'Edit Profile' : 'Set Up Your Profile'}
                </h2>
              </div>
              <p className="mb-6 text-sm text-white/45">
                {existingProfile
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

                {/* Department (optional add-on) */}
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Department <span className="text-white/20">(optional)</span>
                  </label>
                  <Select value={formDepartment} onValueChange={setFormDepartment}>
                    <SelectTrigger className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/25">
                      <SelectValue placeholder={formHouse ? 'Choose your department' : 'Select a house first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {getDepartmentsForHouse(formHouse).length > 0 ? (
                        getDepartmentsForHouse(formHouse).map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none" disabled>
                          Select a house first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                          <span
                            className="text-sm font-bold tracking-wide"
                            style={{ color: isSelected ? house.accent : 'rgba(255,255,255,0.85)' }}
                          >
                            {house.name}
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

                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Department
                  </label>
                  <Select value={formDepartment} onValueChange={setFormDepartment} disabled={!formHouse}>
                    <SelectTrigger className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:ring-1 focus:ring-[#D4AF37]/25">
                      <SelectValue placeholder={formHouse ? 'Select your department' : 'Select your house first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {getDepartmentsForHouse(formHouse).map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {existingProfile ? 'Update Profile' : 'Save & Continue'}
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
