import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, BellRing, Globe, Lock, Save, Settings2, ShieldCheck, Users2 } from 'lucide-react'
import { toast } from 'sonner'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'

export const Route = createFileRoute('/admin/_layout/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { hasPermission } = useAuth()
  const { settings, updateSettings, events } = useData()
  const [localSettings, setLocalSettings] = useState(settings)

  if (!hasPermission('settings', 'read')) {
    return <AccessDenied />
  }

  const handleSave = () => {
    updateSettings(localSettings)
    toast.success('System settings updated successfully')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <PageHeader title="System Settings" subtitle="Configure festival status, registrations, and coordinator roles" />

      <div className="grid gap-6">
        <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-900 p-6">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <div className="rounded-lg bg-gray-800 p-2 text-gray-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Festival Control</h3>
              <p className="text-sm text-gray-400">Global status and public visibility</p>
            </div>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-200">Festival Status</Label>
                <Select value={localSettings.festivalStatus} onValueChange={(value: any) => setLocalSettings({ ...localSettings, festivalStatus: value })}>
                  <SelectTrigger className="h-10 border-gray-600 bg-gray-800">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-600 bg-gray-800">
                    <SelectItem value="pre">Pre-Festival (Coming Soon)</SelectItem>
                    <SelectItem value="live">Live Now (Show Leaderboard)</SelectItem>
                    <SelectItem value="post">Post-Festival (Results View)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Changing status affects the frontend hero section and leaderboard visibility.</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="space-y-1">
                  <Label className="font-medium text-white">Public Registrations</Label>
                  <p className="text-xs text-gray-500">Toggle new participant signups</p>
                </div>
                <Switch checked={localSettings.registrationsOpen} onCheckedChange={(value) => setLocalSettings({ ...localSettings, registrationsOpen: value })} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </div>
                <p className="text-xs text-gray-400">Resetting data will clear all participants and point adjustments. This cannot be undone.</p>
                <Button variant="outline" className="w-full border-red-900 text-red-400 hover:bg-red-950 hover:text-red-300">
                  Reset All System Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-900 p-6">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <div className="rounded-lg bg-gray-800 p-2 text-gray-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Coordinator Assignments</h3>
              <p className="text-sm text-gray-400">Assign coordinators to specific events</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="flex flex-col items-end gap-4 md:flex-row">
                <div className="w-full flex-1 space-y-2">
                  <Label className="text-xs font-medium text-gray-400">Select Coordinator</Label>
                  <Select>
                    <SelectTrigger className="h-10 border-gray-700 bg-gray-900">
                      <SelectValue placeholder="Select staff/student..." />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-900">
                      <SelectItem value="1">Shaik Abdul Hussain</SelectItem>
                      <SelectItem value="2">Libhika</SelectItem>
                      <SelectItem value="3">Nithish Kumar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full flex-1 space-y-2">
                  <Label className="text-xs font-medium text-gray-400">Assign Event</Label>
                  <Select>
                    <SelectTrigger className="h-10 border-gray-700 bg-gray-900">
                      <SelectValue placeholder="Choose event..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] border-gray-700 bg-gray-900">
                      {events.slice(0, 10).map((event) => (
                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="h-10 w-full rounded-md bg-white px-6 font-medium text-black hover:bg-gray-200 md:w-auto">
                  Assign
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="mb-4 px-2 text-sm font-medium text-gray-400">Active Assignments</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'Shaik Abdul', event: 'Basketball' },
                  { name: 'Libhika', event: 'Volleyball' },
                  { name: 'Nithish Kumar', event: 'Tennis' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.event}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-700 hover:text-white">
                      <Lock className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="rounded-md bg-white px-8 py-2 text-sm font-bold text-black transition-colors hover:bg-gray-200">
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}