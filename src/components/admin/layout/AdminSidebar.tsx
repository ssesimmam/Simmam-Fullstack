import {
  LayoutDashboard,
  CalendarDays,
  Bell,
  BookOpen,
  Trophy,
  Shield,
  Users,
  Settings,
  CheckCircle,
  Database,
  UsersRound,
} from 'lucide-react'

import { Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'

const MENU_ITEMS = {
  all: [
    {
      title: 'Dashboard',
      href: '/wch1925',
      icon: LayoutDashboard,
    },
  ],
  core_team: [
    {
      title: 'Leaderboard',
      href: '/wch1925/leaderboard',
      icon: Trophy,
    },
    {
      title: 'Participants',
      href: '/wch1925/participants',
      icon: Users,
    },
    {
      title: 'Registrations',
      href: '/wch1925/registrations',
      icon: Shield,
    },
    {
      title: 'User Management',
      href: '/wch1925/user-management',
      icon: UsersRound,
    },
  ],
  reg_team: [
    {
      title: 'Check-In',
      href: '/wch1925/checkin',
      icon: CheckCircle,
    },
  ],
  developer_admin: [
    {
      title: 'Events',
      href: '/wch1925/events',
      icon: CalendarDays,
    },
    {
      title: 'Notifications',
      href: '/wch1925/announcements',
      icon: Bell,
    },
    {
      title: 'Rules & Regulations',
      href: '/wch1925/rules',
      icon: BookOpen,
    },
    {
      title: 'Data Entry',
      href: '/wch1925/data-entry',
      icon: Database,
    },
    {
      title: 'Leaderboard',
      href: '/wch1925/leaderboard',
      icon: Trophy,
    },
    {
      title: 'Participants',
      href: '/wch1925/participants',
      icon: Users,
    },
    {
      title: 'Check-In',
      href: '/wch1925/checkin',
      icon: CheckCircle,
    },
    {
      title: 'User Management',
      href: '/wch1925/user-management',
      icon: UsersRound,
    },
    {
      title: 'Registrations',
      href: '/wch1925/registrations',
      icon: Shield,
    },
    {
      title: 'Settings',
      href: '/wch1925/settings',
      icon: Settings,
    },
  ],
}

export default function AdminSidebar() {
  const { user, logout } = useAuth()

  if (!user) return null

  const getMenuItems = () => {
    const baseItems = user.role === 'reg_team' ? [] : MENU_ITEMS.all
    const roleItems = MENU_ITEMS[user.role] || []
    return [...baseItems, ...roleItems]
  }

  const menuItems = getMenuItems()

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-[#333] bg-[#111] lg:flex lg:flex-col">
      <div className="border-b border-[#333] p-6">
        <h1 className="font-display text-3xl font-bold text-white tracking-widest">
          SIMMAM
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Admin Control Center
        </p>

        <div className="mt-4 rounded-lg bg-black p-3 border border-[#333]">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
          {user.assignedEvent && (
            <p className="text-xs text-gray-400 mt-1">Event: {user.assignedEvent}</p>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.title}
              to={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-black hover:text-white"
              activeProps={{
                className:
                  'bg-black text-white border border-[#333]',
              }}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#333] p-4">
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
    </aside>
  )
}