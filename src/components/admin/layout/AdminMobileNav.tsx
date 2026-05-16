import {
    CalendarDays,
    LayoutDashboard,
    Megaphone,
    Menu,
    Settings,
    Shield,
    Trophy,
    Users,
    CheckCircle,
    UserCog,
    Database,
} from 'lucide-react'

import { Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const MENU_ITEMS = {
  all: [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
  ],
  coordinator: [
    {
      title: 'Participants',
      href: '/admin/participants',
      icon: Users,
    },
    {
      title: 'Leaderboard',
      href: '/admin/leaderboard',
      icon: Trophy,
    },
  ],
  core_team: [
    {
      title: 'Participants',
      href: '/admin/participants',
      icon: Users,
    },
    {
      title: 'Leaderboard',
      href: '/admin/leaderboard',
      icon: Trophy,
    },
  ],
  reg_team: [
    {
      title: 'Check-In',
      href: '/admin/checkin',
      icon: CheckCircle,
    },
  ],
  developer_admin: [
    {
      title: 'Events',
      href: '/admin/events',
      icon: CalendarDays,
    },
    {
      title: 'Data Entry',
      href: '/admin/data-entry',
      icon: Database,
    },
    {
      title: 'Leaderboard',
      href: '/admin/leaderboard',
      icon: Trophy,
    },
    {
      title: 'Participants',
      href: '/admin/participants',
      icon: Users,
    },
    {
      title: 'Check-In',
      href: '/admin/checkin',
      icon: CheckCircle,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ],
}

export default function AdminMobileNav() {
  const { user, logout } = useAuth()

  if (!user) return null

  const getMenuItems = () => {
    const baseItems = MENU_ITEMS.all
    const roleItems = (MENU_ITEMS as any)[user.role] || []
    return [...baseItems, ...roleItems]
  }

  const menuItems = getMenuItems()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="bg-gray-800 hover:bg-gray-700 flex h-11 w-11 items-center justify-center rounded-lg lg:hidden">
          <Menu className="h-5 w-5 text-white" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="border-[#333] bg-[#111] p-6"
      >
        <div className="border-b border-[#333] pb-6 mb-6">
          <h1 className="font-display text-2xl font-bold text-white tracking-widest">
            SIMMAM
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Admin Control Center
          </p>
          <div className="mt-4 rounded-lg bg-black border border-[#333] p-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            {user.assignedEvent && (
              <p className="text-xs text-gray-400 mt-1">Event: {user.assignedEvent}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.title}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-black hover:text-white"
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-black hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
