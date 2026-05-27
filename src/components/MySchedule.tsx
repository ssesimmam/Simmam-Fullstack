import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Calendar, CheckCircle2, Clock, Hourglass, Info, LogOut, MapPin, Sparkles } from 'lucide-react'

import { clearUser, getUser, getUserRegistrations, syncUserRegistrations, type Registration } from '@/lib/registrationStore'
import { formatIstDateTime, formatIstDayLabel } from '@/lib/dateTime'

function RegistrationCard({ reg }: { reg: Registration }) {
  const dayLabel = formatIstDayLabel(reg.date, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const registeredAt = formatIstDateTime(reg.registeredAt)

  return (
    <article
      id={`reg-card-${reg.eventId}`}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0d0d0d] transition-all duration-300 hover:border-[#D4AF37]/25"
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />

      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/8 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#D4AF37]/80 uppercase">
              <Sparkles className="h-3 w-3" />
              {reg.category}
            </span>

            <h3 className="mb-3 font-display text-xl font-black leading-snug text-white transition-colors group-hover:text-[#D4AF37]">
              {reg.eventName}
            </h3>

            <div className="space-y-1.5">
              {reg.date && (
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]/50" />
                  <span>{dayLabel}</span>
                </div>
              )}
              {reg.timeSlot && (
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]/50" />
                  <span>
                    {reg.timeSlot}
                    {reg.endTime ? ` - ${reg.endTime}` : ''}
                  </span>
                </div>
              )}
              {reg.venue && (
                <div className="flex items-start gap-2 text-sm text-white/50">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]/50" />
                  <span>{reg.venue}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 mt-1 flex flex-col items-center gap-2">
            {!reg.checkedIn ? (
              <>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/8">
                  <Hourglass className="h-6 w-6 animate-pulse text-amber-400" />
                  <div className="absolute inset-0 animate-ping rounded-2xl border border-amber-400/20 opacity-30" />
                </div>
                <span className="max-w-[64px] text-center text-[9px] font-bold uppercase tracking-[0.15em] text-amber-400/80 leading-tight">
                  Waiting<br />Check-In
                </span>
              </>
            ) : (
              <>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/8">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <span className="max-w-[64px] text-center text-[9px] font-bold uppercase tracking-[0.15em] text-green-400/80 leading-tight">
                  Checked In<br />(OD Eligible)
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500/60" />
            <span>Registered - {registeredAt}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] tracking-wider text-amber-400/60">
            <Info className="h-3 w-3" />
            <span>Show this at entry</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function MySchedule() {
  const [user, setUser] = useState(getUser)
  const [registrations, setRegistrations] = useState<Registration[]>([])

  useEffect(() => {
    if (user) {
      setRegistrations(getUserRegistrations(user.email))
      void syncUserRegistrations(user.email)
        .then(setRegistrations)
        .catch(() => {
          // Keep cached registrations if API is temporarily unavailable.
        })
    }
  }, [user])

  const handleLogout = () => {
    clearUser()
    setUser(null)
    setRegistrations([])
  }

  const grouped = registrations.reduce<Record<string, Registration[]>>((accumulator, registration) => {
    const key = registration.date || 'general'
    if (!accumulator[key]) accumulator[key] = []
    accumulator[key].push(registration)
    return accumulator
  }, {})

  const sortedKeys = Object.keys(grouped).sort()

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <div className="mb-8 pt-4">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <span className="text-[10px] tracking-[0.4em] text-[#D4AF37]/70">MY SCHEDULE</span>
        </div>
        <h1 className="mb-1 font-display text-3xl font-black text-white md:text-4xl">
          My <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #D4AF37, #f59e0b)' }}>Registrations</span>
        </h1>
        <p className="text-sm text-white/45">Your confirmed events for SIMMAM 2026. Show this page at the venue entry.</p>
      </div>

      {!user ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8">
            <Hourglass className="h-7 w-7 text-[#D4AF37]" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-white">No Session Found</h2>
          <p className="mx-auto mb-6 max-w-xs text-sm text-white/45">Register for events and your confirmed registrations will appear here.</p>
          <Link to="/events" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.55_0.22_27)] to-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_#D4AF3750]">
            <Calendar className="h-4 w-4" />
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/8 bg-[#0d0d0d] p-4">
            <img src={user.picture} alt={user.name} className="shrink-0 h-12 w-12 rounded-full bg-white/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-white/45">{user.email}</p>
              <p className="mt-0.5 text-xs font-mono text-[#D4AF37]/65">{user.registerNumber}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#D4AF37]">
                {registrations.length} EVENT{registrations.length !== 1 ? 'S' : ''}
              </div>
              <button id="logout-btn" onClick={handleLogout} className="flex items-center gap-1.5 text-[11px] text-white/25 transition hover:text-red-400">
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </div>
          </div>

          {registrations.length > 0 && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/6 p-4">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-400/80">
                Your registrations are confirmed and <strong>waiting for check-in</strong> at the venue. Show this page to the event coordinator to mark your attendance.
              </p>
            </div>
          )}

          {registrations.length === 0 ? (
            <div className="py-16 text-center">
              <Hourglass className="mx-auto mb-3 h-10 w-10 text-white/15" />
              <h2 className="mb-2 font-display text-xl font-bold text-white">No Registrations Yet</h2>
              <p className="mb-6 text-sm text-white/35">Head back to Events and register to see your schedule here.</p>
              <Link to="/events" id="browse-events-link" className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/25 px-6 py-3 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/8">
                <Calendar className="h-4 w-4" />
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {sortedKeys.map((key) => {
                const regs = grouped[key]

                let dayHeading = 'Registered Events'
                if (key !== 'general') {
                  dayHeading = formatIstDayLabel(key, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                }

                return (
                  <section key={key}>
                    <div className="mb-4 flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#D4AF37]/45" />
                      <h2 className="text-sm font-bold tracking-wider text-white/60 uppercase">{dayHeading}</h2>
                      <div className="h-px flex-1 bg-white/6" />
                      <span className="text-xs text-white/20">{regs.length} registered</span>
                    </div>
                    <div className="space-y-4">
                      {regs
                        .sort((left, right) => (left.timeSlot || '').localeCompare(right.timeSlot || ''))
                        .map((registration) => (
                          <RegistrationCard key={registration.eventId} reg={registration} />
                        ))}
                    </div>
                  </section>
                )
              })}

              <div className="pt-2 text-center">
                <Link to="/events" className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-6 py-3 text-sm font-bold text-white/40 transition-all hover:border-[#D4AF37]/25 hover:text-[#D4AF37]">
                  + Register for More Events
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}