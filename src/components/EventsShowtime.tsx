import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  MapPin,
  Zap,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  ShieldAlert,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { getUser, getUserRegistrations, isRegisteredForEvent, syncUserRegistrations } from "@/lib/registrationStore";
import { AuthModal, type RegistrationEvent } from "./AuthModal";
import { useEvents, usePublicSettings } from "@/features/events/useEvents";
import supabase from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/frontendOrigin";

type DisplayEvent = {
  id: string;
  name: string;
  mainCategory: string;
  date: string;
  timeSlot: string;
  endTime: string;
  venue: string;
  registrationOpen: boolean;
};

// ─── Category color map ───────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Tech: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  "Non-Tech": { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  Sports: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
  "Cultural Fest": { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-300" },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: "bg-white/5", text: "text-white/60", dot: "bg-white/40" };
}

// ─── Single Event Card ────────────────────────────────────────────────────────
interface EventCardProps {
  event: DisplayEvent;
  user: ReturnType<typeof getUser>;
  onRegister: (event: DisplayEvent) => void;
  registered: boolean;
  registrationOpen: boolean;
}

function EventCard({ event, user, onRegister, registered, registrationOpen }: EventCardProps) {
  const catStyle = getCategoryStyle(event.mainCategory);

  return (
    <div
      id={`event-card-${event.id}`}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-white/8 bg-[#0d0d0d] hover:border-[#D4AF37]/25 transition-all duration-300 hover:bg-[#111]"
    >
      {/* Time column */}
      <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 shrink-0 sm:w-28">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#D4AF37]/60 shrink-0" />
          <span className="text-sm font-bold text-white">{event.timeSlot}</span>
        </div>
        <span className="text-xs text-white/35">to {event.endTime}</span>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px self-stretch bg-white/8 shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <h3 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
            {event.name}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {event.venue}
          </span>
        </div>

        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${catStyle.bg} ${catStyle.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
            {event.mainCategory}
          </span>
        </div>
      </div>

      {/* Register CTA */}
      <div className="shrink-0">
        {registered ? (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-green-500/10 border border-green-500/25 text-green-400">
            <Check className="w-4 h-4" />
            Already Registered
          </div>
        ) : !registrationOpen ? (
          <div className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-600/20 border border-gray-600/40 text-gray-400 cursor-not-allowed">
            Closed
          </div>
        ) : (
          <button
            id={`register-btn-${event.id}`}
            onClick={() => onRegister(event)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/70 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            Register
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EventsShowtime() {
  const { data: adminEvents = [] } = useEvents();
  const { data: settings } = usePublicSettings();

  // If global registration is closed, show a stunning "Closed" full-page experience
  if (settings && !settings.registrationsOpen) {
    return (
      <div className="relative min-h-[70vh] flex items-center justify-center px-4 py-16">
        {/* Deep ambient glows */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[140px] opacity-15"
            style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-[350px] h-[300px] rounded-full blur-[120px] opacity-10"
            style={{ background: "radial-gradient(circle, oklch(0.55 0.22 27) 0%, transparent 70%)" }}
          />
        </div>

        <div className="w-full max-w-xl text-center relative z-10 animate-rise-in">
          {/* Main glass card */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-8 md:p-12 shadow-[0_0_50px_rgba(212,175,55,0.05)]">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 text-[var(--gold)] shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <ShieldAlert className="h-10 w-10 text-[#D4AF37]" />
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 opacity-20 blur-sm animate-pulse" />
            </div>

            <span className="text-[10px] font-bold tracking-[0.4em] text-[#D4AF37]/80 uppercase">SIMMAM 2026</span>
            <h2 className="mt-3 mb-4 font-display text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-none">
              Portal{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #D4AF37, #f59e0b)" }}
              >
                Closed
              </span>
            </h2>

            <p className="text-sm text-white/55 leading-relaxed mb-8">
              Online registration for all events is currently closed. If you have any questions or require an adjustment to your registered events, please contact your respective <strong className="text-white/80">House Coordinator</strong> or the core registration team.
            </p>

            {/* Info boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
              <Link to="/live-scores" className="p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition block">
                <Trophy className="h-5 w-5 text-[#D4AF37] mb-2" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Live Standings</h3>
                <p className="text-[11px] text-white/45">Stay up-to-date with live point logs and leaderboard standings.</p>
              </Link>
              <Link to="/dashboard/my-schedule" className="p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition block">
                <Calendar className="h-5 w-5 text-[#D4AF37] mb-2" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">My Schedule</h3>
                <p className="text-[11px] text-white/45">Review all your confirmed registrations and schedule slots.</p>
              </Link>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/10 transition-all active:scale-95 animate-lift"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All Events
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-background text-xs font-bold shadow-[var(--shadow-glow-red)] hover:opacity-90 transition-all active:scale-95 animate-lift"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [modalEvent, setModalEvent] = useState<RegistrationEvent | null>(null);
  // Avoid reading sessionStorage during render to keep SSR deterministic.
  const [user, setUser] = useState<ReturnType<typeof getUser> | null>(null);

  // Hydrate user from sessionStorage on mount (client-only)
  useEffect(() => {
    try {
      setUser(getUser());
    } catch {
      // ignore
    }
  }, []);
  const [registrationTick, setRegistrationTick] = useState(0);
  const [animating, setAnimating] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Recompute whenever registrationTick changes (i.e. after any sync or successful registration).
  // Without this, isRegisteredForEvent reads localStorage but React never re-renders because
  // localStorage mutations aren't reactive.
  const registeredEventIds = useMemo(() => {
    if (!user?.email) return new Set<string>();
    const regs = getUserRegistrations(user.email);
    return new Set(regs.map((r) => r.eventId));
  }, [user?.email, registrationTick]);

  const isEventRegistered = (eventId: string, eventName: string): boolean => {
    // Primary: match by ID from the memoized set
    if (registeredEventIds.has(eventId)) return true;
    // Fallback: match by name (for events stored without a numeric backend ID)
    if (!user?.email) return false;
    return isRegisteredForEvent(user.email, eventId, eventName);
  };

  const refreshUser = async () => {
    const freshUser = getUser();
    setUser(freshUser);
    if (freshUser?.email) {
      try {
        await syncUserRegistrations(freshUser.email);
      } catch {
        // ignore
      }
    }
    setRegistrationTick((t) => t + 1);
  };

  const handleGlobalLogin = async () => {
    window.sessionStorage.setItem('simmam_oauth_intent', JSON.stringify({ source: 'public', redirectTo: window.location.pathname }));
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: { hd: 'saveetha.com' },
      },
    });
  };

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      if (!user?.email || !mounted) return;
      await syncUserRegistrations(user.email);
      if (mounted) setRegistrationTick((t) => t + 1);
    };

    void sync();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const handleDateChange = (dateKey: string) => {
    if (dateKey === selectedDate) return;
    setAnimating(true);
    setTimeout(() => {
      setSelectedDate(dateKey);
      setAnimating(false);
    }, 220);
  };

  const scrollDates = (dir: "left" | "right") => {
    if (!dateScrollRef.current) return;
    dateScrollRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  const allDisplayEvents = useMemo<DisplayEvent[]>(() => {
    return adminEvents
      .map((event) => ({
        id: event.id,
        name: event.name,
        mainCategory: (event as any).main_category || (event as any).category || 'Other',
        date: (event as any).date || '',
        timeSlot: (event as any).time_slot || 'TBD',
        endTime: (event as any).end_time || '',
        venue: event.venue || 'Venue TBA',
        registrationOpen: (event as any).registration_open || false,
      }))
      .filter((event) => !!event.date)
      .sort((left, right) => {
        if (left.date === right.date) return left.timeSlot.localeCompare(right.timeSlot)
        return left.date.localeCompare(right.date)
      });
  }, [adminEvents]);

  const festivalDates = useMemo(() => {
    const uniqueDates = Array.from(new Set(allDisplayEvents.map((event) => event.date)));
    return uniqueDates.map((dateKey) => {
      const dateObj = new Date(`${dateKey}T12:00:00+05:30`);
      const short = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      return {
        key: dateKey,
        label: `${short} ${dateObj.getDate()} ${month}`,
        short,
        day: dateObj.getDate(),
        month,
      };
    });
  }, [allDisplayEvents]);

  useEffect(() => {
    if (!selectedDate && festivalDates.length > 0) {
      setSelectedDate(festivalDates[0].key);
    }
  }, [festivalDates, selectedDate]);

  useEffect(() => {
    const pendingEventId = localStorage.getItem('simmam_pending_registration_event_id')
    if (!pendingEventId || allDisplayEvents.length === 0) return

    const pendingEvent = allDisplayEvents.find((event) => event.id === pendingEventId)
    if (!pendingEvent) return

    setSelectedDate(pendingEvent.date)
    setModalEvent({
      id: pendingEvent.id,
      backendEventId: pendingEvent.id,
      name: pendingEvent.name,
      category: pendingEvent.mainCategory,
      date: pendingEvent.date,
      timeSlot: pendingEvent.timeSlot,
      endTime: pendingEvent.endTime,
      venue: pendingEvent.venue,
    })
    localStorage.removeItem('simmam_pending_registration_event_id')
  }, [allDisplayEvents])

  const filteredEvents = allDisplayEvents.filter((event) => event.date === selectedDate);

  const grouped = filteredEvents.reduce<Record<string, DisplayEvent[]>>(
    (acc, ev) => {
      if (!acc[ev.mainCategory]) acc[ev.mainCategory] = [];
      acc[ev.mainCategory].push(ev);
      return acc;
    },
    {}
  );

  const selectedDateInfo = festivalDates.find((d) => d.key === selectedDate);

  const toRegEvent = (e: DisplayEvent): RegistrationEvent => ({
    id: e.id,
    backendEventId: e.id,
    name: e.name,
    category: e.mainCategory,
    date: e.date,
    timeSlot: e.timeSlot,
    endTime: e.endTime,
    venue: e.venue,
    dayLabel: selectedDateInfo?.label,
  });

  return (
    <div className="relative pb-20">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-4 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <span className="text-[10px] tracking-[0.4em] text-[#D4AF37]/70">SIMMAM 2026</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black text-white mb-1">
          Event{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #D4AF37, #f59e0b)" }}
          >
            Schedule
          </span>
        </h1>
        <p className="text-sm text-white/50">
          Select a date to explore events · Click Register to secure your spot
        </p>

        {user ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs text-[#D4AF37]">
                Signed in as <strong>{user.name}</strong>
              </span>
              <Link
                to="/dashboard/my-schedule"
                className="text-[10px] tracking-wider text-[#D4AF37]/70 hover:text-[#D4AF37] transition ml-1"
              >
                MY SCHEDULE →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleGlobalLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/15 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              Log In
            </button>
            <Link
              to="/dashboard/profile"
              search={{ signup: '1' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/80 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition cursor-pointer"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* ── Date Selector ──────────────────────────────────────── */}
      <div className="sticky top-[60px] z-30 bg-[#000]/95 backdrop-blur border-b border-white/8 mb-6">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => scrollDates("left")}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition"
            aria-label="Scroll dates left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={dateScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-none flex-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {festivalDates.map((d) => {
              const isSelected = d.key === selectedDate;
              const count = allDisplayEvents.filter((event) => event.date === d.key).length;
              return (
                <button
                  key={d.key}
                  id={`date-tab-${d.key}`}
                  onClick={() => handleDateChange(d.key)}
                  className={`shrink-0 flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]"
                      : "border-white/8 text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className={`text-[9px] tracking-[0.3em] font-bold ${isSelected ? "text-[#D4AF37]/70" : "text-white/30"}`}>
                    {d.short}
                  </span>
                  <span className={`text-xl font-black leading-none ${isSelected ? "text-[#D4AF37]" : "text-white"}`}>
                    {d.day}
                  </span>
                  <span className={`text-[9px] tracking-widest ${isSelected ? "text-[#D4AF37]/70" : "text-white/30"}`}>
                    {d.month}
                  </span>
                  <span className={`text-[9px] mt-0.5 ${isSelected ? "text-[#D4AF37]/60" : "text-white/25"}`}>
                    {count} events
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollDates("right")}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition"
            aria-label="Scroll dates right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Event List ─────────────────────────────────────────── */}
      <div
        className="max-w-5xl mx-auto px-4"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-4 h-4 text-[#D4AF37]/60" />
          <h2 className="font-display text-lg font-bold text-white">
            {selectedDateInfo?.label}
          </h2>
          <span className="text-xs text-white/35 ml-auto">{filteredEvents.length} events</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No events scheduled for this date.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, events]) => {
              const catStyle = getCategoryStyle(category);
              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-2 h-2 rounded-full ${catStyle.dot}`} />
                    <h3 className={`text-xs font-bold tracking-[0.25em] uppercase ${catStyle.text}`}>
                      {category}
                    </h3>
                    <div className="h-px flex-1 bg-white/6" />
                    <span className="text-[10px] text-white/25">
                      {events.length} {events.length === 1 ? "slot" : "slots"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {events.map((ev) => {
                      return (
                        <EventCard
                          key={ev.id}
                          event={ev}
                          user={user}
                          registered={isEventRegistered(ev.id, ev.name)}
                          registrationOpen={ev.registrationOpen}
                          onRegister={(e) => setModalEvent(toRegEvent(e))}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {user && (
          <div className="mt-10 text-center">
            <Link
              to="/dashboard/my-schedule"
              id="view-my-schedule-btn"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-bold hover:bg-[#D4AF37]/10 transition-all"
            >
              <Calendar className="w-4 h-4" />
              View My Schedule
            </Link>
          </div>
        )}
      </div>

      {/* ── Auth / Registration Modal ────────────────────────── */}
      {modalEvent && (
        <AuthModal
          event={modalEvent}
          onClose={() => { setModalEvent(null); void refreshUser(); }}
          onRegistered={() => { setModalEvent(null); void refreshUser(); }}
        />
      )}

    </div>
  );
}
