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
} from "lucide-react";
import { getUser, isRegisteredForEvent, syncUserRegistrations } from "@/lib/registrationStore";
import { AuthModal, type RegistrationEvent } from "./AuthModal";
import { useData } from "@/lib/store";

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
  const { events: adminEvents } = useData();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [modalEvent, setModalEvent] = useState<RegistrationEvent | null>(null);
  const [user, setUser] = useState(getUser);
  const [registrationTick, setRegistrationTick] = useState(0);
  const [animating, setAnimating] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const refreshUser = () => {
    setUser(getUser());
    setRegistrationTick((t) => t + 1);
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
      .filter((event) => event.is_floated)
      .map((event) => ({
        id: event.id,
        name: event.name,
        mainCategory: event.mainCategory,
        date: (event as any).date || '',
        timeSlot: event.time || 'TBD',
        endTime: (event as any).endTime || '',
        venue: event.venue || 'Venue TBA',
        registrationOpen: event.registration_open,
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
      const dateObj = new Date(`${dateKey}T12:00:00`);
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
                to="/my-schedule"
                className="text-[10px] tracking-wider text-[#D4AF37]/70 hover:text-[#D4AF37] transition ml-1"
              >
                MY SCHEDULE →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/15 transition"
            >
              <User className="w-3.5 h-3.5" />
              Log In
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
                          registered={user ? isRegisteredForEvent(user.email, ev.id, ev.name) : false}
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
              to="/my-schedule"
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
          onClose={() => { setModalEvent(null); refreshUser(); }}
          onRegistered={() => { setModalEvent(null); refreshUser(); }}
        />
      )}

    </div>
  );
}
