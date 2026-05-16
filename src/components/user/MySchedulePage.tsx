import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { MySchedule } from '@/components/MySchedule'
import { Navbar } from '@/components/Navbar'
import { Particles } from '@/components/Particles'

export function MySchedulePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000]">
      <Navbar />
      <Particles count={12} className="!fixed inset-0 -z-10" />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 h-[500px] w-[300px] rounded-full bg-[#D4AF37] opacity-8 blur-[130px]" />
      </div>

      <main className="relative pt-28 md:pt-32">
        <div className="mx-auto mb-6 max-w-3xl px-4">
          <Link to="/events" className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-[#D4AF37]/60 transition-colors hover:text-[#D4AF37]">
            <ArrowLeft className="h-3.5 w-3.5" /> BACK TO EVENTS
          </Link>
        </div>

        <MySchedule />
      </main>

      <Footer />
    </div>
  )
}
