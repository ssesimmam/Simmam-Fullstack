import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, LogIn, Mail, Shield, X } from 'lucide-react'

import {
  getUser,
  clearUser,
  isRegisteredForEvent,
  registerForEvent,
  saveUser,
  type UserProfile,
} from '@/lib/registrationStore'
import { fetchUserProfileByEmail } from '@/lib/apiClient'

export type RegistrationEvent = {
  id: string
  backendEventId?: string
  name: string
  category: string
  date?: string
  timeSlot?: string
  endTime?: string
  venue?: string
  dayLabel?: string
}

type Step = 'login' | 'confirm' | 'success'

interface AuthModalProps {
  event: RegistrationEvent
  onClose: () => void
  onRegistered: () => void
}

export function AuthModal({ event, onClose, onRegistered }: AuthModalProps) {
  const existingUser = getUser()
  const [step, setStep] = useState<Step>(existingUser ? 'confirm' : 'login')
  const [formEmail, setFormEmail] = useState(existingUser?.email ?? '')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLoginSubmit = async (eventSubmit: React.FormEvent) => {
    eventSubmit.preventDefault()
    setFormError('')

    if (!formEmail.trim() || !/^[^\s@]+@saveetha\.com$/i.test(formEmail.trim())) {
      setFormError('A valid email address is required.')
      return
    }

    setSubmitting(true)
    try {
      const result = await fetchUserProfileByEmail(formEmail.trim())
      if (!result.user) {
        setFormError('No profile found for that email. Please sign up first.')
        return
      }

      const newUser: UserProfile = {
        email: result.user.email.toLowerCase(),
        name: result.user.name,
        picture: result.user.picture_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(result.user.name)}`,
        registerNumber: result.user.register_number || '',
        mobileNumber: result.user.mobile_number,
        house: result.user.house || '',
      }

      clearUser()
      saveUser(newUser)
      setStep('confirm')
    } catch (error: any) {
      setFormError(error?.message || 'Unable to sign in right now.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmSubmit = async () => {
    const user = getUser()
    if (!user) {
      setStep('login')
      return
    }

    setFormError('')
    setSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      const result = await registerForEvent(user.email, {
      eventId: event.id,
      backendEventId: event.backendEventId,
      eventName: event.name,
      date: event.date ?? '',
      timeSlot: event.timeSlot ?? '',
      endTime: event.endTime ?? '',
      venue: event.venue ?? '',
      category: event.category,
      })

      setSubmitting(false)

      if (result.alreadyRegistered) {
        setFormError('You are already registered for this event.')
        return
      }

      setStep('success')
      setTimeout(() => {
        onRegistered()
      }, 1500)
    } catch (error: any) {
      setSubmitting(false)
      setFormError(error?.message || 'Unable to complete registration right now.')
    }
  }

  const currentUser = getUser()
  const alreadyReg = currentUser && isRegisteredForEvent(currentUser.email, event.backendEventId ?? event.id, event.name)

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Event registration"
      >
        <div className="relative w-full max-w-md animate-rise-in" onClick={(e) => e.stopPropagation()}>
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: '#D4AF37' }} />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'oklch(0.55 0.22 27)' }} />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
            <div className="h-1 w-full bg-gradient-to-r from-[oklch(0.55_0.22_27)] via-[#D4AF37] to-[oklch(0.55_0.22_27)]" />

            <button
              onClick={onClose}
              id="auth-modal-close"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 md:p-8">
              {step !== 'success' && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3">
                  <div className="shrink-0 rounded-lg bg-[#D4AF37]/15 p-2">
                    <Shield className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Registering For</p>
                    <p className="truncate text-sm font-bold text-white">{event.name}</p>
                    {(event.dayLabel || event.timeSlot || event.venue) && (
                      <p className="truncate text-xs text-white/45">{[event.dayLabel, event.timeSlot, event.venue].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </div>
              )}

              {step === 'login' && (
                <form onSubmit={handleLoginSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="mb-1 flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-[#D4AF37]" />
                    <h2 className="font-display text-xl font-bold text-white">Login</h2>
                  </div>
                  <p className="mb-6 text-sm text-white/45">Enter your Saveetha email to continue registering for events.</p>

                  <div className="mb-6">
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.25em] text-white/35">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="192421111.simats@saveetha.com"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-12 text-sm text-white placeholder:text-white/25 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{formError}</p>
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-3.5 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="mt-4 text-center text-xs text-white/35">
                    New here?{' '}
                    <Link
                      to="/profile"
                      search={{ signup: '1' }}
                      className="font-semibold text-[#D4AF37] transition hover:text-[#f3c95b]"
                    >
                      Sign Up
                    </Link>
                  </div>
                </form>
              )}

              {step === 'confirm' && currentUser && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h2 className="mb-1 font-display text-xl font-bold text-white">Confirm Registration</h2>
                  <p className="mb-5 text-xs text-white/45">Click below to secure your spot for this event.</p>

                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3">
                    <img src={currentUser.picture} alt={currentUser.name} className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
                      <p className="truncate text-xs text-[#D4AF37]">{currentUser.registerNumber}</p>
                    </div>
                  </div>

                  {alreadyReg && (
                    <div className="mb-5 rounded-xl border border-green-500/25 bg-green-500/10 p-3 text-sm font-medium text-green-400">You are already registered for this event.</div>
                  )}

                  {formError && (
                    <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{formError}</p>
                  )}

                  {alreadyReg ? (
                    <button
                      onClick={onClose}
                      className="w-full rounded-xl border border-white/10 py-3.5 text-sm font-bold text-white/60 transition-all hover:bg-white/5 hover:text-white"
                    >
                      Close Window
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmSubmit}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.55_0.22_27)] to-[#D4AF37] py-3.5 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_#D4AF3760] disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                          Registering...
                        </>
                      ) : (
                        'Confirm Registration'
                      )}
                    </button>
                  )}
                </div>
              )}

              {step === 'success' && (
                <div className="animate-in zoom-in-95 py-6 text-center duration-300">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/25 bg-green-500/12">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="mb-2 font-display text-2xl font-bold text-white">Confirmed!</h2>
                  <p className="mb-1 text-sm text-white/55">
                    You are registered for <span className="font-semibold text-[#D4AF37]">{event.name}</span>
                  </p>
                  <p className="text-xs text-white/35">Check My Schedule to view your registration status.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}