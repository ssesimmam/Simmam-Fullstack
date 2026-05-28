import { Outlet, Link, createRootRoute } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth'
import favicon from '../assets/simmam-lion.png'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'SIMMAM 2026 — Events & Dashboard' },
      { name: 'description', content: 'Register for events, track your schedule, and manage the SIMMAM 2026 admin dashboard.' },
      { name: 'author', content: 'SIMATS Engineering' },
      { property: 'og:title', content: 'SIMMAM 2026' },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'icon', href: favicon, type: 'image/png' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/events" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go to Events
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'

function RootComponent() {
  useEffect(() => {
    // Fallback: If Supabase ignored the redirectTo and dumped the ?code= param on the root/current page
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('code') && !window.location.pathname.includes('/auth/callback')) {
      window.location.href = `/auth/callback${window.location.search}`
    }
  }, [])

  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}
