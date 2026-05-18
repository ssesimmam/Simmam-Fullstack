import { createFileRoute } from '@tanstack/react-router';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Particles } from '@/components/Particles';
import { useData } from '@/lib/store';
import { Calendar, MapPin, Clock, Trophy, Medal, Zap, Check } from 'lucide-react';
import { showtimeEvents } from '@/lib/showtimeEvents';

export const Route = createFileRoute('/live')({
  component: LivePage,
});

function LivePage() {
  const { events } = useData();

  // Tomorrow's Live Floated Events
  const tomorrowEvents = events.filter((e) => e.is_floated && e.is_live_tomorrow);

  // Group published results by day
  const publishedResults = events.filter((e) => e.result?.isPublished);
  const resultsByDay = publishedResults.reduce((acc, event) => {
    const day = event.result?.resultDay || 'OTHER';
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000]">
      <Navbar />
      <Particles count={15} className="!fixed inset-0 -z-10" />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] opacity-10"
          style={{ background: '#D4AF37' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] rounded-full blur-[120px] opacity-8"
          style={{ background: 'oklch(0.55 0.22 27)' }}
        />
      </div>

      <main className="relative pt-28 md:pt-32 pb-20 max-w-5xl mx-auto px-4">
        
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <span className="text-[10px] tracking-[0.4em] text-[#D4AF37]/70">SIMMAM 2026</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-white mb-2">
            Live{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #D4AF37, #f59e0b)' }}
            >
              Updates
            </span>
          </h1>
          <p className="text-sm text-white/50">
            Real-time highlights, tomorrow's schedule, and event results.
          </p>
        </div>

        {/* SECTION 1: Tomorrow's Floated Events */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-bold text-white">Tomorrow's Events</h2>
          </div>

          {tomorrowEvents.length === 0 ? (
            <div className="text-center py-12 border border-white/5 bg-white/5 rounded-2xl">
              <p className="text-white/40 text-sm">No events floated for tomorrow yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tomorrowEvents.map((event) => {
                // Prefer admin-managed schedule values, fall back to the legacy showtime map.
                const showtime = showtimeEvents.find((s) => s.name === event.name);
                const eventDate = (event as any).date || showtime?.date || '';
                const timeSlot = (event as any).time || showtime?.timeSlot || 'TBA';
                const endTime = (event as any).end_time || showtime?.endTime || 'TBA';
                const venue = event.venue || showtime?.venue || 'Venue TBA';
                const dayLabel = eventDate
                  ? new Date(`${eventDate}T12:00:00`).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    }).toUpperCase()
                  : showtime?.dayLabel || 'Tomorrow';

                return (
                  <div
                    key={event.id}
                    className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-white/10 bg-[#0a0a0a] hover:border-[#D4AF37]/30 transition-all duration-300 hover:bg-[#111]"
                  >
                    {/* Time Column */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 shrink-0 sm:w-32">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#D4AF37]/70 shrink-0" />
                        <span className="text-sm font-bold text-white">{timeSlot}</span>
                      </div>
                      <span className="text-xs text-white/40">to {endTime}</span>
                      <span className="text-[10px] text-[#D4AF37]/50 mt-1">{dayLabel}</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px self-stretch bg-white/10 shrink-0" />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                          {event.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/50 border border-white/10">
                          {event.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {venue}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-semibold">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    {/* Registration CTA */}
                    <div className="shrink-0 mt-3 sm:mt-0">
                      {event.registration_open ? (
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-[#D4AF37]/40 text-[#D4AF37]">
                          <Zap className="w-4 h-4" />
                          Reg. Open
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-600/20 border border-gray-600/40 text-gray-400">
                          Closed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: Daily Winners & Runner-Ups */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-3">
            <Trophy className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-bold text-white">Event Results</h2>
          </div>

          {Object.keys(resultsByDay).length === 0 ? (
            <div className="text-center py-12 border border-white/5 bg-white/5 rounded-2xl">
              <p className="text-white/40 text-sm">No results published yet.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(resultsByDay).map(([day, evs]) => (
                <div key={day} className="space-y-4">
                  <h3 className="text-sm font-bold text-[#D4AF37] tracking-[0.2em] uppercase">
                    {day}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {evs.map((event) => (
                      <div key={event.id} className="p-5 rounded-2xl border border-white/10 bg-[#0a0a0a]">
                        <h4 className="text-base font-bold text-white mb-4">{event.name}</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-[#D4AF37]" />
                              </div>
                              <div>
                                <p className="text-[10px] text-[#D4AF37]/70 uppercase tracking-wider font-bold">Winner</p>
                                <p className="text-sm font-bold text-white">{event.result?.winnerHouse}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Medal className="w-4 h-4 text-gray-300" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Runner-Up</p>
                                <p className="text-sm font-bold text-white">{event.result?.runnerUpHouse}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
