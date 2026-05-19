import { Bell, Search, LogOut } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'

import AdminMobileNav from './AdminMobileNav'

export default function AdminHeader() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-[#333] bg-black">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <AdminMobileNav />

          <div>
            <h2 className="font-display text-2xl text-white">
              Admin Dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-[#111] border border-[#333] flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black transition-colors">
            <Search className="h-5 w-5 text-white" />
          </button>

          <button className="bg-[#111] border border-[#333] flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black transition-colors">
            <Bell className="h-5 w-5 text-white" />
          </button>

          {user && (
            <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-[#333]">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate({ to: '/wch1925/login', replace: true })
                }}
                className="bg-[#111] border border-[#333] flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black transition-colors"
              >
                <LogOut className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}