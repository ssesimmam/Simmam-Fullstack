import { ShieldX } from 'lucide-react'

import PageHeader from './PageHeader'

export default function AccessDenied() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="glass-strong max-w-md rounded-3xl p-8 neon-border-red">
        <ShieldX className="mx-auto h-16 w-16 text-red-400" />

        <PageHeader
          title="Access Denied"
          subtitle="You do not have permission to access this page. Please contact your administrator if you believe this is an error."
        />

        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            Required permissions not found for your role.
          </p>
        </div>
      </div>
    </div>
  )
}