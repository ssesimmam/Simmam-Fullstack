import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/admin/shared/PageHeader'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createAdminAnnouncement, deleteAdminAnnouncement, fetchAdminAnnouncements, type AdminAnnouncementRow, updateAdminAnnouncement } from '@/lib/adminApi'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/_layout/announcements')({
  component: AnnouncementsPage,
})

function AnnouncementsPage() {
  const { hasPermission } = useAuth()
  const [items, setItems] = useState<AdminAnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pinned, setPinned] = useState(true)
  const [startsAt, setStartsAt] = useState<string | undefined>(undefined)
  const [endsAt, setEndsAt] = useState<string | undefined>(undefined)

  if (!hasPermission('announcements', 'read')) {
    return <AccessDenied />
  }

  useEffect(() => {
    void loadItems()
  }, [])

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

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      if (selectedId) {
        await updateAdminAnnouncement(selectedId, {
          title: title.trim(),
          body: body.trim() || undefined,
          pinned,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
        })
        toast.success('Announcement updated')
        setSelectedId(null)
      } else {
        await createAdminAnnouncement({ title: title.trim(), body: body.trim() || undefined, pinned, starts_at: startsAt || null, ends_at: endsAt || null })
        toast.success('Announcement published')
      }
      setTitle('')
      setBody('')
      setPinned(true)
      setStartsAt(undefined)
      setEndsAt(undefined)
      await loadItems()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to publish announcement')
    }
  }

  const handleEdit = (item: AdminAnnouncementRow) => {
    setSelectedId(item.id)
    setTitle(item.title || '')
    setBody(item.body || '')
    setPinned(!!item.pinned)
    setStartsAt(item.starts_at || undefined)
    setEndsAt(item.ends_at || undefined)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setSelectedId(null)
    setTitle('')
    setBody('')
    setPinned(true)
    setStartsAt(undefined)
    setEndsAt(undefined)
  }

  const handleSendNow = async () => {
    const nowIso = new Date().toISOString()
    try {
      if (!title.trim()) {
        toast.error('Title is required')
        return
      }
      if (selectedId) {
        await updateAdminAnnouncement(selectedId, { title: title.trim(), body: body.trim() || undefined, pinned: true, starts_at: nowIso, ends_at: endsAt || null })
        toast.success('Announcement sent')
      } else {
        await createAdminAnnouncement({ title: title.trim(), body: body.trim() || undefined, pinned: true, starts_at: nowIso, ends_at: endsAt || null })
        toast.success('Announcement sent')
      }
      setTitle('')
      setBody('')
      setSelectedId(null)
      setPinned(true)
      setStartsAt(undefined)
      setEndsAt(undefined)
      await loadItems()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send announcement')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminAnnouncement(id)
      toast.success('Announcement removed')
      await loadItems()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete announcement')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Create and push announcements" />

      <div className="rounded-lg border border-[#333] bg-[#111] p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="bg-black border-[#333] text-white" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification details" className="bg-black border-[#333] text-white min-h-24" />
          <div className="flex flex-col items-end space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-white" />
              <span className="text-white">Pinned</span>
            </label>
            <Input type="datetime-local" value={startsAt ? startsAt.substring(0, 19) : ''} onChange={(e) => setStartsAt(e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="bg-black border-[#333] text-white" placeholder="Starts at" />
            <Input type="datetime-local" value={endsAt ? endsAt.substring(0, 19) : ''} onChange={(e) => setEndsAt(e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="bg-black border-[#333] text-white" placeholder="Ends at" />
            <div className="flex items-center gap-2">
              <Button className="bg-white text-black hover:bg-gray-200" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" /> {selectedId ? 'Save' : 'Publish'}
              </Button>
              <Button variant="ghost" onClick={handleSendNow} className="text-white/80 border-white/10">Send now</Button>
              {selectedId && (
                <Button variant="secondary" onClick={handleCancelEdit} className="text-gray-300">Cancel</Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400">Loading announcements...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          ) : items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#333] bg-black p-4">
              <div>
                <p className="text-white font-semibold">{item.title}</p>
                <p className="text-sm text-gray-400">{item.body || 'No body provided'}</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
