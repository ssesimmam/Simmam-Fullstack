import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Trophy,
  Users,
  CheckCircle,
  Database,
  UsersRound,
  Music2,
  Bell,
  BookOpen,
  Award,
} from 'lucide-react'

import { Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

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
      title: 'Department Analytics',
      href: '/wch1925/department-leaderboard',
      icon: Database,
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
      href: '/reg1925/checkin',
      icon: CheckCircle,
    },
  ],
  developer_admin: [
    {
      title: 'Developers',
      href: '/wch1925/developers',
      icon: Users,
    },
    {
      title: 'Events',
      href: '/wch1925/events',
      icon: CalendarDays,
    },
    {
      title: 'Culturals',
      href: '/wch1925/culturals',
      icon: Music2,
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
      title: 'Department Analytics',
      href: '/wch1925/department-leaderboard',
      icon: Database,
    },
    {
      title: 'Participants',
      href: '/wch1925/participants',
      icon: Users,
    },
    {
      title: 'Check-In',
      href: '/reg1925/checkin',
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
      title: 'Certificates',
      href: '/wch1925/certificates',
      icon: Award,
    },
    {
      title: 'Settings',
      href: '/wch1925/settings',
      icon: Settings,
    },
  ],
}

export default function AdminMobileNav() {
  const { user, logout } = useAuth()

  if (!user) return null

  const getMenuItems = () => {
    const baseItems = user.role === 'reg_team' ? [] : MENU_ITEMS.all
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
        className="border-[#333] bg-[#111] p-6 overflow-y-auto"
      >
        <div className="border-b border-[#333] pb-6 mb-6 mt-4">
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

        <div className="space-y-1 pb-8">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <SheetClose asChild key={item.title}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-black hover:text-white"
                  activeProps={{
                    className:
                      'bg-black text-white border border-[#333]',
                  }}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </Link>
              </SheetClose>
            )
          })}

          <div className="pt-4 mt-4 border-t border-[#333]">
            <SheetClose asChild>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-black hover:text-white"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
