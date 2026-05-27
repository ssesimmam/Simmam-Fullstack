import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Particles } from '@/components/Particles'
import { EventsShowtime } from '@/components/EventsShowtime'

export const Route = createFileRoute('/portal/register')({
  head: () => ({
    meta: [
      { title: 'Portal Registration — SIMMAM 2026' },
      {
        name: 'description',
        content: 'Backend-connected event registration page under the portal section.',
      },
    ],
  }),
  component: PortalRegisterPage,
})

function PortalRegisterPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000]">
      <Navbar />
      <Particles count={15} className="!fixed inset-0 -z-10" />

      <main className="relative pt-28 md:pt-32">
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO PORTAL
          </Link>
        </div>

        <EventsShowtime />
      </main>

      <Footer />
    </div>
  )
}