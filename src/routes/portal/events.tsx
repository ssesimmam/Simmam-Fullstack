import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Particles } from '@/components/Particles'
import { Events } from '@/components/Events'

export const Route = createFileRoute('/portal/events')({
  head: () => ({
    meta: [
      { title: 'Portal Events — SIMMAM 2026' },
      {
        name: 'description',
        content: 'Backend-connected SIMMAM events and registrations page under the portal section.',
      },
    ],
  }),
  component: PortalEventsPage,
})

function PortalEventsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000]">
      <Navbar />
      <Particles count={20} className="!fixed inset-0 -z-10" />

      <main className="relative pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-gold/80 hover:text-gold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO PORTAL
          </Link>
        </div>

        <Events />
      </main>

      <Footer />
    </div>
  )
}