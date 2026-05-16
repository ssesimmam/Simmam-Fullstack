import type { ReactNode } from 'react'

import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'

interface Props {
  children: ReactNode
}

export default function AdminLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative flex">
        <AdminSidebar />

        <main className="min-h-screen flex-1 lg:ml-72">
          <AdminHeader />

          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}