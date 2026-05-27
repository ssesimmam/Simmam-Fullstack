import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, LayoutDashboard, LogIn, User } from 'lucide-react'

export const Route = createFileRoute('/portal/')({
  head: () => ({
    meta: [
      { title: 'Portal — SIMMAM 2026' },
      {
        name: 'description',
        content: 'Backend-connected SIMMAM 2026 pages for events, live scores, profile, and admin access.',
      },
    ],
  }),
  component: PortalHome,
})

const entries = [
  {
    to: '/portal/events',
    icon: CalendarDays,
    title: 'Events',
    description: 'Open the backend-powered events experience and registrations page.',
  },
  {
    to: '/portal/live',
    icon: LayoutDashboard,
    title: 'Live Dashboard',
    description: 'View the live scoring dashboard and house rankings page.',
  },
  {
    to: '/portal/profile',
    icon: User,
    title: 'User Profile',
    description: 'Sign in, sync your registration profile, and manage your dashboard.',
  },
  {
    to: '/portal/admin',
    icon: LogIn,
    title: 'Admin Access',
    description: 'Jump straight to the admin login and dashboard flow.',
  },
]

function PortalHome() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="mb-4 text-[10px] font-bold tracking-[0.55em] text-[#D4AF37]/70">
            SIMMAM 2026 PORTAL
          </p>
          <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">
            Backend-connected pages,
            <span className="block text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #D4AF37, #f59e0b)' }}>
              without changing the landing page.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/55 md:text-base">
            Use this portal as the new entry point for interactive SIMMAM flows. The public home page stays static, while these pages call the backend for events, live scores, profile sync, and admin access.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => {
            const Icon = entry.icon

            return (
              <Link
                key={entry.to}
                to={entry.to}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-white/8"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{entry.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/50">{entry.description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}