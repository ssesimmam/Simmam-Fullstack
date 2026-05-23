import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarClock, Edit3, Plus, Pin, Search, Trash2 } from 'lucide-react'
import PageHeader from '@/components/admin/shared/PageHeader'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  updateAdminAnnouncement,
  type AdminAnnouncementRow,
} from '@/lib/adminApi'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/announcements')({
  component: AnnouncementsPage,
})

type AnnouncementForm = {
  title: string
  body: string
  pinned: boolean
  starts_at: string
  ends_at: string
}

const emptyForm: AnnouncementForm = {
  title: '',
  body: '',
  pinned: true,
  starts_at: '',
  ends_at: '',
}

const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const toApiDatetime = (value: string) => (value ? new Date(value).toISOString() : null)

const getAnnouncementStatus = (item: AdminAnnouncementRow) => {
  const now = Date.now()
  const startsAt = item.starts_at ? Date.parse(item.starts_at) : null
  const endsAt = item.ends_at ? Date.parse(item.ends_at) : null

  if (startsAt && startsAt > now) return 'Scheduled'
  if (endsAt && endsAt < now) return 'Expired'
  return 'Live'
}

function AnnouncementsPage() {
  const { hasPermission } = useAuth()
  const [items, setItems] = useState<AdminAnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminAnnouncementRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<AnnouncementForm>(emptyForm)

  const canRead = hasPermission('announcements', 'read')
  const canCreate = hasPermission('announcements', 'create')
  const canDelete = hasPermission('announcements', 'delete')

  useEffect(() => {
    if (!canRead) return
    void loadItems()
  }, [canRead])

  const loadItems = async () => {
    setLoading(true)
    try {
      setItems(await fetchAdminAnnouncements())
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const openCreateEditor = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setEditorOpen(true)
  }

  const openEditEditor = (item: AdminAnnouncementRow) => {
    setEditingItem(item)
    setForm({
      title: item.title || '',
      body: item.body || '',
      pinned: Boolean(item.pinned),
      starts_at: toDatetimeLocalValue(item.starts_at),
      ends_at: toDatetimeLocalValue(item.ends_at),
    })
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (form.ends_at && form.starts_at && new Date(form.ends_at) < new Date(form.starts_at)) {
      toast.error('End time must be after start time')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim() || null,
        pinned: form.pinned,
        starts_at: toApiDatetime(form.starts_at),
        ends_at: toApiDatetime(form.ends_at),
      }

      if (editingItem) {
        await updateAdminAnnouncement(editingItem.id, payload)
        toast.success('Notification updated')
      } else {
        await createAdminAnnouncement(payload)
        toast.success('Notification published')
      }

      closeEditor()
      await loadItems()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save notification')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete notifications')
      return
    }

    if (!window.confirm('Delete this notification?')) {
      return
    }

    try {
      await deleteAdminAnnouncement(id)
      toast.success('Notification removed')
      await loadItems()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete notification')
    }
  }

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => {
      return [item.title, item.body || '', item.id]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [items, searchQuery])

  if (!canRead) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Create, schedule, and edit the messages that appear in the frontend bell icon."
      />

      <div className="rounded-lg border border-[#333] bg-[#111] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search notifications by title, body, or id"
              className="bg-black border-[#333] pl-10 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <Button className="bg-[#D4AF37] text-black hover:bg-[#e0bd55]" onClick={openCreateEditor}>
                <Plus className="mr-2 h-4 w-4" /> New Notification
              </Button>
            )}
            <Button className="bg-white text-black hover:bg-gray-200" onClick={loadItems}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400">Loading notifications...</p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#333] bg-black/40 p-6 text-sm text-gray-400">
              No notifications yet. Create one to send it to users.
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getAnnouncementStatus(item)

              return (
                <div key={item.id} className="rounded-xl border border-[#333] bg-black p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{item.title}</p>
                        <Badge className="border border-[#333] bg-[#151515] text-xs text-gray-300">
                          {status}
                        </Badge>
                        {item.pinned ? (
                          <Badge className="border border-[#333] bg-[#1d1a10] text-xs text-[#D4AF37]">
                            <Pin className="mr-1 h-3.5 w-3.5" /> Pinned
                          </Badge>
                        ) : null}
                      </div>

                      <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-gray-400">
                        {item.body || 'No message body provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {item.starts_at ? new Date(item.starts_at).toLocaleString() : 'Starts immediately'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Bell className="h-3.5 w-3.5" />
                          {item.ends_at ? `Ends ${new Date(item.ends_at).toLocaleString()}` : 'No end time'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      {canCreate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#333] bg-[#111] text-white hover:bg-[#1a1a1a]"
                          onClick={() => openEditEditor(item)}
                        >
                          <Edit3 className="mr-1 h-4 w-4" /> Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <Dialog open={editorOpen} onOpenChange={(open) => (open ? setEditorOpen(true) : closeEditor())}>
        <DialogContent className="max-w-3xl border-[#333] bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Notification' : 'New Notification'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Notification title"
                  className="bg-black border-[#333] text-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Textarea
                  value={form.body}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Notification message"
                  className="min-h-32 bg-black border-[#333] text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">Start time</label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))}
                  className="bg-black border-[#333] text-white"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">End time</label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))}
                  className="bg-black border-[#333] text-white"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#333] bg-black px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Pin to top</p>
                <p className="text-xs text-gray-500">Pinned notifications stay above regular messages in the bell feed.</p>
              </div>
              <Switch checked={form.pinned} onCheckedChange={(checked) => setForm((current) => ({ ...current, pinned: checked }))} />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" className="border-[#333] bg-black text-white hover:bg-[#1a1a1a]" onClick={closeEditor}>
                Cancel
              </Button>
              <Button className="bg-[#D4AF37] text-black hover:bg-[#e0bd55]" onClick={handleSave} disabled={isSaving || !canCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {editingItem ? 'Save Changes' : 'Publish Notification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
