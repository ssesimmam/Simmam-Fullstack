import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { DashboardLiveScores } from "@/components/DashboardLiveScores";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Particles } from "@/components/Particles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIMMAM 2026 — SIMATS Engineering Culturals" },
      {
        name: "description",
        content:
          "SIMMAM 2026 — the national-level cultural festival of SIMATS Engineering. Live scores and a celebration of student excellence.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // Suppress 404 errors from tracking/external scripts
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Failed to load') || 
          (event.filename && event.filename.includes('hybridaction'))) {
        event.preventDefault();
      }
    };
    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Loader />
      <Navbar />
      <main className="relative">
        <Particles count={20} className="!fixed inset-0 -z-10" />
        <DashboardLiveScores />
      </main>
      <Footer />
    </div>
  );
}
