import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Particles } from "@/components/Particles";
import { EventsShowtime } from "@/components/EventsShowtime";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — SIMMAM 2026" },
      {
        name: "description",
        content: "Register for your favorite events at SIMMAM 2026.",
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

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] opacity-10"
          style={{ background: "#D4AF37" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] rounded-full blur-[120px] opacity-8"
          style={{ background: "oklch(0.55 0.22 27)" }}
        />
      </div>

      <main className="relative pt-28 md:pt-32">
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO ALL EVENTS
          </Link>
        </div>

        <EventsShowtime />
      </main>

      <Footer />
    </div>
  );
}
