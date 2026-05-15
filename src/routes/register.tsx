import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Particles } from "@/components/Particles";
import { EventsShowtime } from '@/components/EventsShowtime';

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    event: typeof search.event === "string" ? search.event : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Register — SIMMAM 2026" },
      {
        name: "description",
        content: "Event registration for SIMMAM 2026 opens soon. Stay tuned!",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000]">
      <Navbar />
      <Particles count={15} className="!fixed inset-0 -z-10" />

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/3 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full blur-[140px] opacity-10"
          style={{ background: '#D4AF37' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full blur-[120px] opacity-8"
          style={{ background: 'oklch(0.55 0.22 27)' }}
        />
      </div>

      <main className="relative pt-28 md:pt-32">
        <div className="mx-auto mb-6 max-w-5xl px-4">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-[#D4AF37]/60 transition-colors hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> BACK TO ALL EVENTS
          </Link>
        </div>

        <EventsShowtime />
      </main>

      <Footer />
    </div>
  );
}
