import { ShieldX } from 'lucide-react'

import PageHeader from './PageHeader'

export default function AccessDenied() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="bg-[#111] border border-[#333] rounded-3xl p-8 max-w-md">
        <ShieldX className="mx-auto h-16 w-16 text-white" />

        <PageHeader
          title="Access Denied"
          subtitle="You don't have permission to access this page. Please contact your administrator if you believe this is an error."
        />

        <div className="mt-6">
          <p className="text-sm text-gray-400">
            Required permissions not found for your role.
          </p>
        </div>
      </div>
    </div>
  )
}