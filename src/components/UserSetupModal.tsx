import { useState, useEffect } from 'react'
import { ArrowRight, Hash, Mail, Shield, User, X } from 'lucide-react'
import { getUser, saveUser, type UserProfile } from '@/lib/registrationStore'
import { fetchUserProfileByEmail } from '@/lib/apiClient'
import { useHouses } from '@/features/events/useEvents'

const HOUSE_EXTRAS: Record<string, { short: string }> = {
  'Agniyas': { short: 'AG' },
  'Dhronas': { short: 'DR' },
  'Marutas': { short: 'MA' },
  'Rudras': { short: 'RU' },
  'Suryas': { short: 'SU' },
  'Vajras': { short: 'VA' },
}

const HOUSE_DEPARTMENTS: Record<string, string[]> = {
  'Agniyas': [
    'Biosciences',
    'Sustainable Engineering',
    'Research and Innovation',
    'Center for Applied Research',
    'VLSI Microelectronics',
    'Condensed Matter Physics',
    'Cognitive Computing',
    'Pure & Applied Mathematics',
    'Industrial Mathematics',
    'Smart Materials',
    'Coding Linguistics',
    'World Languages',
    'Wireless Networks',
    'Softskills',
    'Management Studies',
    'Mathematical Studies'
  ],
  'Dhronas': [
    'Mathematical Sciences',
    'Electronic Instrumentation System',
    'Predictive Engineering',
    'Green Computing',
    'Neural Networks',
    'Physics',
    'Autotronics',
    'Green Electronic',
    'Computational Biology',
    'Electrical Power and Energy Conversion',
    'Nxt-Gen Computing',
    'Scientific Computing',
    'Smart Construction Engineering',
    'Signal and Image Processing',
    'Surface Chemistry',
    'Digital Electronics and Computing Systems'
  ],
  'Marutas': [
    'IC-Intelligent Computing',
    'Bioengineering',
    'Applied Machine Learning',
    'Nanobiomaterials',
    'Medicinal Chemistry',
    'Environmental Biotechnology',
    'Mechanical and Innovation',
    'Thermal Engineering',
    'Nanotechnology',
    'Computational Intelligence',
    'Intelligence Systems',
    'Quantum Mathematics',
    'Quantitative Engineering and Employability Skill',
    'Big Data and Network Security',
    'Spatial Informatics'
  ],
  'Rudras': [
    'Cloud Computing',
    'Additive Manufacturing Engineering',
    'Electrical Power and Drives Engineering',
    'Information Security',
    'Medical Biotechnology',
    'Programming',
    'Cyber Security',
    'Embedded Systems',
    'Integrated Electronics',
    'Nano Electronics Materials and Sensors',
    'Data Vista',
    'Medical Informatics',
    'Electric Power Technology',
    'Medical Electronics',
    'Quantum Communication',
    'Languages Dynamics'
  ],
  'Suryas': [
    'Manufacturing',
    'Plasma Physics',
    'Product Development',
    'Electrochemistry',
    'Molecular Analytics',
    'Computational Mathematics',
    'Quantum Intelligence',
    'Reinforcement Learning',
    'Blockchain Technology',
    'Materials Chemistry',
    'RF and Communication System',
    'Networking',
    'High Performance Computing',
    'Genetic Engineering',
    'Engineering Mathematics',
    'Edge Computing'
  ],
  'Vajras': [
    'Vedic Mathematics',
    'Mathematics for Excellence',
    'Generative AI',
    'Post Harvest Engineering',
    'Deep Learning',
    'Nano Computing',
    'Mathematics for Innovation',
    'Molecular Physics',
    'Computational Data Science',
    'Machine Learning',
    'Super Computing',
    'Green Technology',
    'Swarm Intelligence',
    'Knowledge Engineering',
    'Wireless Communication'
  ]
}

interface UserSetupModalProps {
  onSave: () => void
  onClose: () => void
  preventDismiss?: boolean
  existingProfile?: UserProfile | null
}

export function UserSetupModal({ onSave, onClose, preventDismiss = false, existingProfile: propProfile }: UserSetupModalProps) {
  const { data: dbHouses = [] } = useHouses()
  const houses = dbHouses.map(h => ({
    ...h,
    short: HOUSE_EXTRAS[h.name]?.short || h.name.substring(0, 2).toUpperCase(),
  }))

  // Do not access sessionStorage during render. Hydrate on mount.
  const [formName, setFormName] = useState('')
  const [formRegNo, setFormRegNo] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formHouse, setFormHouse] = useState('')
  const [formDepartment, setFormDepartment] = useState('')
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
        setFormEmail(existing.email ?? '')
        setFormHouse(existing.house ?? '')
        setFormDepartment(existing.department ?? '')
      }
    } catch {
      // ignore
    }
  }, [])

  // Sync prop changes to local state in case the parent loads the profile asynchronously
  useEffect(() => {
    if (propProfile) {
      setExistingProfile(propProfile)
      setFormName(prev => prev || propProfile.name || '')
      setFormRegNo(prev => prev || propProfile.registerNumber || '')
      setFormMobile(prev => prev || propProfile.mobileNumber || '')
      setFormEmail(prev => prev || propProfile.email || '')
      setFormHouse(prev => prev || propProfile.house || '')
      setFormDepartment(prev => prev || propProfile.department || '')
    }
  }, [propProfile])

  // Clear department if it doesn't belong to the newly selected house
  useEffect(() => {
    if (formHouse && formDepartment) {
      const validDepts = HOUSE_DEPARTMENTS[formHouse] || []
      if (!validDepts.includes(formDepartment)) {
        setFormDepartment('')
      }
    }
  }, [formHouse, formDepartment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formName.trim()) { setError('Full name is required.'); return }
    if (!formRegNo.trim()) { setError('Register number is required.'); return }
    if (!formMobile.trim()) { setError('Mobile number is required.'); return }
    if (!/^\d{10}$/.test(formMobile.trim())) { setError('Mobile number must be 10 digits.'); return }
    if (!formEmail.trim() || !/^[^\s@]+@saveetha\.com$/i.test(formEmail.trim())) { setError('Email must end with @saveetha.com.'); return }
    if (!formHouse) { setError('Please select your house.'); return }
    if (!formDepartment.trim()) { setError('Department is required.'); return }

    setSubmitting(true)
    const normalizedEmail = formEmail.trim().toLowerCase()

    try {
      const backendProfile = await fetchUserProfileByEmail(normalizedEmail)
      if (!existingProfile && backendProfile) {
        setError('This email is already registered. Please log in instead.')
        setSubmitting(false)
        return
      }
      if (existingProfile && existingProfile.email !== normalizedEmail && backendProfile) {
        setError('This email is already registered. Please use a different email or log in.')
        setSubmitting(false)
        return
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to verify email registration status.')
      setSubmitting(false)
      return
    }

    const user: UserProfile = {
      email: normalizedEmail,
      name: formName.trim(),
      picture: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(formName.trim())}`,
      registerNumber: formRegNo.trim().toUpperCase(),
      mobileNumber: formMobile.trim(),
      house: formHouse,
      department: formDepartment.trim(),
    }

    try {
      await saveUser(user)
      onSave()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Unable to save your profile. Please try again.')
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

                {/* Department Selection */}
                <div className={`transition-all duration-300 ${!formHouse ? 'opacity-50 grayscale' : ''}`}>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      id="setup-department"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      disabled={!formHouse}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25 disabled:cursor-not-allowed [&>option]:bg-[#1a1a1a]"
                    >
                      <option value="" disabled className="text-white/25">
                        {!formHouse ? 'Select a house first' : 'Select your department'}
                      </option>
                      {(formHouse ? (HOUSE_DEPARTMENTS[formHouse] || []) : []).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
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
