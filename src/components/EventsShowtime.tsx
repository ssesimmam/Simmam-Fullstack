import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Calendar, Check, ChevronLeft, ChevronRight, Clock, MapPin, User, Zap } from 'lucide-react'

import { AuthModal, type RegistrationEvent } from './AuthModal'
import { getUser, isRegistered } from '@/lib/registrationStore'
import { FESTIVAL_DATES, showtimeEvents, type ShowtimeEvent } from '@/lib/showtimeEvents'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Tech: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  'Non-Tech': { bg: 'bg-pink-500/10', text: 'text-pink-400', dot: 'bg-pink-400' },
  Sports: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
}

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: 'bg-white/5', text: 'text-white/60', dot: 'bg-white/40' }
}

interface EventCardProps {
  event: ShowtimeEvent
  user: ReturnType<typeof getUser>
  onRegister: (event: ShowtimeEvent) => void
  registered: boolean
}

function EventCard({ event, onRegister, registered }: EventCardProps) {
  const categoryStyle = getCategoryStyle(event.mainCategory)

  return (
    <div
      id={`event-card-${event.id}`}
      className="group relative flex flex-col gap-4 rounded-2xl border border-white/8 bg-[#0d0d0d] p-4 transition-all duration-300 hover:border-[#D4AF37]/25 hover:bg-[#111] sm:flex-row sm:items-center"
    >
      <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:flex-col sm:items-start sm:gap-1">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0 text-[#D4AF37]/60" />
          <span className="text-sm font-bold text-white">{event.timeSlot}</span>
        </div>
        <span className="text-xs text-white/35">to {event.endTime}</span>
      </div>

      <div className="hidden shrink-0 self-stretch bg-white/8 sm:block sm:w-px" />

      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-base font-bold leading-snug text-white transition-colors group-hover:text-[#D4AF37]">
          {event.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            {event.venue}
          </span>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${categoryStyle.bg} ${categoryStyle.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${categoryStyle.dot}`} />
            {event.mainCategory}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {registered ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/10 px-5 py-2.5 text-sm font-bold text-green-400">
            <Check className="h-4 w-4" />
            Registered
          </div>
        ) : (
          <button
            id={`register-btn-${event.id}`}
            onClick={() => onRegister(event)}
            className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-bold text-[#D4AF37] transition-all hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/10 active:scale-95"
          >
            <Zap className="h-3.5 w-3.5" />
            Register
          </button>
        )}
      </div>
    </div>
  )
}

export function EventsShowtime() {
  const [selectedDate, setSelectedDate] = useState(FESTIVAL_DATES[0].key)
  const [modalEvent, setModalEvent] = useState<RegistrationEvent | null>(null)
  const [user, setUser] = useState(getUser)
  const [registrationTick, setRegistrationTick] = useState(0)
  const [animating, setAnimating] = useState(false)
  const dateScrollRef = useRef<HTMLDivElement>(null)

  const refreshUser = () => {
    setUser(getUser())
    setRegistrationTick((tick) => tick + 1)
  }

  const handleDateChange = (dateKey: string) => {
    if (dateKey === selectedDate) return
    setAnimating(true)
    setTimeout(() => {
      setSelectedDate(dateKey)
      setAnimating(false)
    }, 220)
  }

  const scrollDates = (direction: 'left' | 'right') => {
    if (!dateScrollRef.current) return
    dateScrollRef.current.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' })
  }

  const filteredEvents = showtimeEvents.filter((event) => event.date === selectedDate)

  const grouped = filteredEvents.reduce<Record<string, ShowtimeEvent[]>>((accumulator, event) => {
    if (!accumulator[event.mainCategory]) accumulator[event.mainCategory] = []
    accumulator[event.mainCategory].push(event)
    return accumulator
  }, {})

  const selectedDateInfo = FESTIVAL_DATES.find((date) => date.key === selectedDate)

  const toRegEvent = (event: ShowtimeEvent): RegistrationEvent => ({
    id: event.id,
    name: event.name,
    category: event.mainCategory,
    date: event.date,
    timeSlot: event.timeSlot,
    endTime: event.endTime,
    venue: event.venue,
    dayLabel: event.dayLabel,
  })

  return (
    <div className="relative pb-20">
      <div className="mx-auto mb-8 max-w-5xl px-4 pt-4">
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <span className="text-[10px] tracking-[0.4em] text-[#D4AF37]/70">SIMMAM 2026</span>
        </div>
        <h1 className="mb-1 font-display text-3xl font-black text-white md:text-4xl">
          Event <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #D4AF37, #f59e0b)' }}>Schedule</span>
        </h1>
        <p className="text-sm text-white/50">Select a date to explore events. Click Register to secure your spot.</p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
            <User className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-xs text-[#D4AF37]">
              Signed in as <strong>{user.name}</strong>
            </span>
            <Link to="/my-schedule" className="ml-1 text-[10px] tracking-wider text-[#D4AF37]/70 transition hover:text-[#D4AF37]">
              MY SCHEDULE →
            </Link>
          </div>
        )}
      </div>

      <div className="sticky top-[60px] z-30 mb-6 border-b border-white/8 bg-[#000]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <button
            onClick={() => scrollDates('left')}
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Scroll dates left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div ref={dateScrollRef} className="scrollbar-none flex flex-1 gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {FESTIVAL_DATES.map((date) => {
              const isSelected = date.key === selectedDate
              const count = showtimeEvents.filter((event) => event.date === date.key).length

              return (
                <button
                  key={date.key}
                  id={`date-tab-${date.key}`}
                  onClick={() => handleDateChange(date.key)}
                  className={`shrink-0 rounded-xl border px-5 py-2.5 transition-all duration-200 ${isSelected ? 'border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-white/8 text-white/50 hover:border-white/20 hover:text-white'}`}
                >
                  <span className={`text-[9px] font-bold tracking-[0.3em] ${isSelected ? 'text-[#D4AF37]/70' : 'text-white/30'}`}>{date.short}</span>
                  <span className={`block text-xl font-black leading-none ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>{date.day}</span>
                  <span className={`text-[9px] tracking-widest ${isSelected ? 'text-[#D4AF37]/70' : 'text-white/30'}`}>MAY</span>
                  <span className={`mt-0.5 text-[9px] ${isSelected ? 'text-[#D4AF37]/60' : 'text-white/25'}`}>{count} events</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => scrollDates('right')}
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Scroll dates right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.22s ease, transform 0.22s ease' }}>
        <div className="mb-6 flex items-center gap-3">
          <Calendar className="h-4 w-4 text-[#D4AF37]/60" />
          <h2 className="font-display text-lg font-bold text-white">{selectedDateInfo?.label}</h2>
          <span className="ml-auto text-xs text-white/35">{filteredEvents.length} events</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-20 text-center text-white/30">
            <Calendar className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No events scheduled for this date.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, events]) => {
              const categoryStyle = getCategoryStyle(category)

              return (
                <section key={category}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${categoryStyle.dot}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-[0.25em] ${categoryStyle.text}`}>{category}</h3>
                    <div className="h-px flex-1 bg-white/6" />
                    <span className="text-[10px] text-white/25">{events.length} {events.length === 1 ? 'slot' : 'slots'}</span>
                  </div>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        user={user}
                        registered={user ? isRegistered(user.email, event.id) : false}
                        onRegister={(selectedEvent) => setModalEvent(toRegEvent(selectedEvent))}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {user && (
          <div className="mt-10 text-center">
            <Link to="/my-schedule" id="view-my-schedule-btn" className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 px-6 py-3 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/10">
              <Calendar className="h-4 w-4" />
              View My Schedule
            </Link>
          </div>
        )}
      </div>

      {modalEvent && (
        <AuthModal
          event={modalEvent}
          onClose={() => setModalEvent(null)}
          onRegistered={() => {
            refreshUser()
            setModalEvent(null)
          }}
        />
      )}
    </div>
  )
}