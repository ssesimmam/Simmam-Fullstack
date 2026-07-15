import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Activity } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Events } from '@/components/Events'
import { Tilt3D } from '@/components/Tilt3D'

export const Route = createFileRoute('/events/')({
  head: () => ({
    meta: [
      { title: 'Events — SIMMAM 2026' },
      { name: 'description', content: 'Explore the SIMMAM 2026 events — dance, music, coding, esports, photography, drama, fashion, technical, and fun competitions.' },
      { property: 'og:title', content: 'SIMMAM 2026 Events' },
    ],
  }),
  component: EventsPage,
})

function EventsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="relative pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-gold/80 hover:text-gold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO HOME
          </Link>
        </div>

        {/* Website Under Maintenance Card */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <Tilt3D max={5}>
            <div className="relative group glass-strong rounded-3xl p-10 overflow-hidden hover-lift border border-red-500/30 flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 backdrop-blur-md animate-pulse">
                    <Activity className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <h3 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-4">Events Are Completed</h3>
                <p className="text-foreground/80 max-w-2xl mx-auto text-lg">All events have successfully concluded. Thank you for participating!</p>
              </div>
            </div>
          </Tilt3D>
        </div>

        <Events />
      </main>
      <Footer />
    </div>
  )
}
