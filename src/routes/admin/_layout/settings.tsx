import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import WebHealthMonitor from '@/components/admin/WebHealthMonitor'
import { useState } from 'react'
import { 
  Globe, 
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
  const { hasPermission, user } = useAuth()
  const { settings, updateSettings } = useData()
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
        subtitle="Configure festival status and registration controls"
      />

      <div className="grid gap-6">
        {/* Festival Configuration */}
        <div className="bg-[#111] border border-[#333] rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#333] pb-4">
            <div className="p-2 bg-black rounded-lg text-gray-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Festival Control</h3>
              <p className="text-sm text-gray-500">Global status and public visibility</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-200">Festival Status</Label>
                <Select 
                  value={localSettings.festivalStatus} 
                  onValueChange={(val: any) => setLocalSettings({...localSettings, festivalStatus: val})}
                >
                  <SelectTrigger className="bg-black border-[#333] h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333]">
                    <SelectItem value="pre">Pre-Festival (Coming Soon)</SelectItem>
                    <SelectItem value="live">Live Now (Show Leaderboard)</SelectItem>
                    <SelectItem value="post">Post-Festival (Results View)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Changing status affects the frontend hero section and leaderboard visibility.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-[#333]">
                <div className="space-y-1">
                  <Label className="text-white font-medium">Public Registrations</Label>
                  <p className="text-xs text-gray-500">Toggle new participant signups</p>
                </div>
                <Switch 
                  checked={localSettings.registrationsOpen} 
                  onCheckedChange={(val) => setLocalSettings({...localSettings, registrationsOpen: val})}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-black rounded-lg border border-[#333] space-y-4">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </div>
                <p className="text-xs text-gray-500">
                  Resetting data will clear all participants and point adjustments. This cannot be undone.
                </p>
                <Button variant="outline" className="w-full border-[#333] text-white hover:bg-white hover:text-black">
                  Reset All System Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Web Health Monitor — developer admin only */}
        {user?.role === 'developer_admin' && (
          <WebHealthMonitor />
        )}

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
