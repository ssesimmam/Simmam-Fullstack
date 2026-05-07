import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Particles } from "@/components/Particles";
import { PastYears } from "@/components/PastYears";
import { Gallery } from "@/components/Gallery";

export const Route = createFileRoute("/archive-gallery")({
  head: () => ({
    meta: [
      { title: "Archive — SIMMAM 2026" },
      {
        name: "description",
        content:
          "Explore SIMMAM archive highlights and memories together on one immersive page.",
      },
      { property: "og:title", content: "SIMMAM Archive" },
      {
        property: "og:description",
        content: "A combined page for legacy highlights and festival memories.",
      },
    ],
  }),
  component: ArchiveGalleryPage,
});

function ArchiveGalleryPage() {
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

        <PastYears />
        <Gallery />
      </main>

      <Footer />
    </div>
  );
}
