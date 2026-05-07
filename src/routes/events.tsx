import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Particles } from "@/components/Particles";
import { Events } from "@/components/Events";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — SIMMAM 2026" },
      {
        name: "description",
        content:
          "Explore the SIMMAM 2026 events page with dance, music, coding, esports, photography, drama, fashion, technical, and fun competitions.",
      },
      { property: "og:title", content: "SIMMAM 2026 Events" },
      {
        property: "og:description",
        content: "A dedicated page for all SIMMAM 2026 events and registrations.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <Particles count={20} className="!fixed inset-0 -z-10" />

      <main className="relative pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-gold/80 hover:text-gold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO HOME
          </Link>
        </div>

        <Events />
      </main>

      <Footer />
    </div>
  );
}