import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import {
  Settings2,
  ShieldCheck,
  Users2,
  BellRing,
  Globe,
  Lock,
  Save,
  AlertTriangle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

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
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="System Settings"
        subtitle="Configure festival status, registrations, and coordinator roles"
      />

      <div className="grid gap-6">
        {/* Festival Configuration */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <div className="p-2 bg-gray-800 rounded-lg text-gray-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Festival Control</h3>
              <p className="text-sm text-gray-400">Global status and public visibility</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-200">Festival Status</Label>
                <Select
                  value={localSettings.festivalStatus}
                  onValueChange={(val: any) => setLocalSettings({ ...localSettings, festivalStatus: val })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="pre">Pre-Festival (Coming Soon)</SelectItem>
                    <SelectItem value="live">Live Now (Show Leaderboard)</SelectItem>
                    <SelectItem value="post">Post-Festival (Results View)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Changing status affects the frontend hero section and leaderboard visibility.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="space-y-1">
                  <Label className="text-white font-medium">Public Registrations</Label>
                  <p className="text-xs text-gray-500">Toggle new participant signups</p>
                </div>
                <Switch
                  checked={localSettings.registrationsOpen}
                  onCheckedChange={(val) => setLocalSettings({ ...localSettings, registrationsOpen: val })}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-[#111] rounded-lg border border-[#333] space-y-4">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </div>
                <p className="text-xs text-gray-400">
                  Resetting data will clear all participants and point adjustments. This cannot be undone.
                </p>
                <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-white hover:text-black">
                  Reset All System Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Access Management */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <div className="p-2 bg-gray-800 rounded-lg text-gray-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Coordinator Assignments</h3>
              <p className="text-sm text-gray-400">Assign coordinators to specific events</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-xs font-medium text-gray-400">Select Coordinator</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-700 h-10">
                      <SelectValue placeholder="Select staff/student..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="1">Shaik Abdul Hussain</SelectItem>
                      <SelectItem value="2">Libhika</SelectItem>
                      <SelectItem value="3">Nithish Kumar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-xs font-medium text-gray-400">Assign Event</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-700 h-10">
                      <SelectValue placeholder="Choose event..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 max-h-[200px]">
                      {events.slice(0, 10).map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-white text-black font-medium h-10 px-6 rounded-md w-full md:w-auto hover:bg-gray-200">
                  Assign
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-4 px-2">Active Assignments</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'Shaik Abdul', event: 'Basketball' },
                  { name: 'Libhika', event: 'Volleyball' },
                  { name: 'Nithish Kumar', event: 'Tennis' }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between border border-gray-700">
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.event}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-700 hover:text-white">
                      <Lock className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            className="bg-white text-black font-bold text-sm px-8 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}
