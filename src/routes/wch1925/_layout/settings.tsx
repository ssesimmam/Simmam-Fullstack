import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import WebHealthMonitor from '@/components/admin/WebHealthMonitor'
import { useData, type AdminSettings } from '@/lib/store'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Settings, Shield, ToggleLeft, ToggleRight, Sparkles, Check, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/wch1925/_layout/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { hasPermission, user } = useAuth()
  const { settings, updateSettings } = useData()
  
  const [saving, setSaving] = useState(false)
  const [regOpen, setRegOpen] = useState(settings?.registrationsOpen ?? true)
  const [festivalStatus, setFestivalStatus] = useState<AdminSettings['festivalStatus']>(settings?.festivalStatus ?? 'pre')

  // Keep state in sync with context
  useEffect(() => {
    if (settings) {
      setRegOpen(settings.registrationsOpen)
      setFestivalStatus(settings.festivalStatus)
    }
  }, [settings])

  if (!hasPermission('settings', 'read')) {
    return <AccessDenied />
  }

  const handleToggleRegistration = async (checked: boolean) => {
    setRegOpen(checked)
    setSaving(true)
    const nextSettings: AdminSettings = {
      festivalStatus,
      registrationsOpen: checked,
      coordinatorAssignments: settings?.coordinatorAssignments || {},
    }

    try {
      await updateSettings(nextSettings)
      toast.success(`Registrations are now globally ${checked ? 'OPEN' : 'CLOSED'}`)
    } catch (err: any) {
      setRegOpen(!checked) // revert on fail
      toast.error(err?.message || 'Failed to update registration status')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeFestivalStatus = async (status: AdminSettings['festivalStatus']) => {
    setFestivalStatus(status)
    setSaving(true)
    const nextSettings: AdminSettings = {
      festivalStatus: status,
      registrationsOpen: regOpen,
      coordinatorAssignments: settings?.coordinatorAssignments || {},
    }

    try {
      await updateSettings(nextSettings)
      toast.success(`Festival phase updated to: ${status.toUpperCase()}`)
    } catch (err: any) {
      setFestivalStatus(festivalStatus) // revert on fail
      toast.error(err?.message || 'Failed to update festival status')
    } finally {
      setSaving(false)
    }
  }

  const isDeveloperOrCore = user?.role === 'developer_admin' || user?.role === 'core_team'

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="System Settings"
        subtitle="Developer admin utilities, global festival status, and system monitoring"
      />

      {isDeveloperOrCore && (
        <div className="grid gap-6 md:grid-cols-1">
          {/* Global Parameters Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            {/* Ambient gold glow */}
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--gold)]/10 blur-3xl pointer-events-none" />

            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--gold)]/10 p-3 text-[var(--gold)]">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Global Registration Controls</h3>
                  <p className="text-xs text-gray-500">Configure public portal availability & event modes</p>
                </div>
              </div>

              {saving && (
                <div className="flex items-center gap-2 text-xs text-[var(--gold)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving settings...</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Registration Toggle Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition duration-300">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Global Registration Status</h4>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      regOpen 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${regOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                      {regOpen ? 'Open & Active' : 'Globally Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                    Open or close registrations for all floated events. If closed, the public registration page (`/register`) will transition into a premium "Registrations Closed" state.
                  </p>
                </div>
                
                <div className="flex items-center shrink-0">
                  <Switch
                    checked={regOpen}
                    onCheckedChange={handleToggleRegistration}
                    disabled={saving}
                    className="data-[state=checked]:bg-[var(--gold)]"
                  />
                </div>
              </div>

              {/* Festival Status row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition duration-300">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Festival Lifecycle State</h4>
                  <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                    Switch between pre-event anticipation, live showtime, and post-event wraps. This adjusts standard landing defaults dynamically.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {(['pre', 'live', 'post'] as const).map((status) => {
                    const isSelected = festivalStatus === status
                    const labels: Record<string, string> = {
                      pre: 'Pre-Event',
                      live: 'Live Showtime',
                      post: 'Post-Event',
                    }
                    const styles: Record<string, string> = {
                      pre: isSelected ? 'bg-amber-500/15 border-amber-500/50 text-amber-400' : 'text-gray-400 hover:text-white border-white/5 bg-white/5',
                      live: isSelected ? 'bg-red-500/15 border-red-500/50 text-red-400' : 'text-gray-400 hover:text-white border-white/5 bg-white/5',
                      post: isSelected ? 'bg-blue-500/15 border-blue-500/50 text-blue-400' : 'text-gray-400 hover:text-white border-white/5 bg-white/5',
                    }

                    return (
                      <button
                        key={status}
                        onClick={() => void handleChangeFestivalStatus(status)}
                        disabled={saving}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 ${styles[status]}`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        {labels[status]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'developer_admin' && (
        <WebHealthMonitor />
      )}
    </div>
  )
}
