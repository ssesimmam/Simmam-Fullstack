import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  Music2, Save, Eye, EyeOff, ImageIcon, Type, Plus, Trash2,
  Upload, GripVertical, ChevronUp, ChevronDown, ExternalLink, Info,
} from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import {
  getAdminSettings,
  saveAdminSettings,
  uploadCulturalsImage,
  type AdminSettings,
  type CulturalsArtist,
} from '@/api/admin/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/culturals')({
  component: CulturalsAdminPage,
})

function makeId() {
  return `artist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function ArtistCard({
  artist,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  artist: CulturalsArtist
  index: number
  total: number
  onChange: (updated: CulturalsArtist) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadCulturalsImage(file)
      onChange({ ...artist, imageUrl: url })
      toast.success('Image uploaded to Supabase Storage ✓')
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] bg-black/30">
        <GripVertical className="w-4 h-4 text-gray-600 cursor-grab flex-shrink-0" />
        <span className="text-xs font-mono text-gray-500">#{String(index + 1).padStart(2, '0')}</span>
        <span className="text-sm font-semibold text-white flex-1 truncate">{artist.name || 'Untitled Artist'}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Artist Name *</Label>
            <Input
              value={artist.name}
              onChange={(e) => onChange({ ...artist, name: e.target.value })}
              placeholder="e.g. Anirudh Ravichander"
              className="bg-black border-[#2a2a2a] text-white text-sm placeholder:text-gray-700"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Description / Tagline</Label>
            <Input
              value={artist.description || ''}
              onChange={(e) => onChange({ ...artist, description: e.target.value })}
              placeholder="e.g. Playback singer & composer"
              className="bg-black border-[#2a2a2a] text-white text-sm placeholder:text-gray-700"
            />
          </div>
        </div>

        {/* Image */}
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            Artist Poster
          </Label>

          {/* Upload + URL row */}
          <div className="flex gap-2">
            <Input
              value={artist.imageUrl || ''}
              onChange={(e) => onChange({ ...artist, imageUrl: e.target.value })}
              placeholder="Paste image URL or upload below"
              className="bg-black border-[#2a2a2a] text-white text-xs font-mono flex-1 placeholder:text-gray-700"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border border-[#2a2a2a] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition disabled:opacity-50 whitespace-nowrap"
              title="Upload image to Supabase Storage"
            >
              {uploading ? (
                <span className="w-3 h-3 border border-[#D4AF37]/40 border-t-[#D4AF37] rounded-full animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Preview toggle */}
          {artist.imageUrl && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-[#D4AF37] hover:underline"
              >
                {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPreview ? 'Hide preview' : 'Preview image'}
              </button>
            </div>
          )}

          {showPreview && artist.imageUrl && (
            <img
              src={artist.imageUrl}
              alt="Preview"
              className="w-full max-h-52 object-cover rounded-lg border border-[#222]"
              onError={() => toast.error('Image failed to load')}
            />
          )}
        </div>

        {/* Reveal toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
          <div>
            <p className="text-xs font-medium text-white">Revealed to public</p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              ON = image shown directly on public page
            </p>
          </div>
          <Switch
            checked={artist.revealed ?? false}
            onCheckedChange={(v) => onChange({ ...artist, revealed: v })}
          />
        </div>
      </div>
    </div>
  )
}

function CulturalsAdminPage() {
  const { hasPermission, user } = useAuth()
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [artists, setArtists] = useState<CulturalsArtist[]>([])

  if (!hasPermission('events', 'read')) {
    return <AccessDenied />
  }

  const canManage = user?.role === 'developer_admin'

  useEffect(() => {
    setLoading(true)
    getAdminSettings()
      .then((s) => {
        setSettings(s)
        setTitle(s.culturalsTitle || '')
        setArtists(
          (s.culturalsArtists || []).map((a, i) => ({ ...a, order: a.order ?? i }))
        )
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const addArtist = () => {
    const newArtist: CulturalsArtist = {
      id: makeId(),
      name: '',
      description: '',
      imageUrl: '',
      revealed: false,
      order: artists.length,
    }
    setArtists((prev) => [...prev, newArtist])
  }

  const updateArtist = (id: string, updated: CulturalsArtist) =>
    setArtists((prev) => prev.map((a) => (a.id === id ? updated : a)))

  const removeArtist = (id: string) =>
    setArtists((prev) => prev.filter((a) => a.id !== id))

  const moveArtist = (index: number, dir: 'up' | 'down') => {
    const next = [...artists]
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]
    setArtists(next.map((a, i) => ({ ...a, order: i })))
  }

  const handleSave = async () => {
    if (!settings) return
    const named = artists.filter((a) => a.name.trim())
    if (artists.length > 0 && named.length < artists.length) {
      toast.error('All artists must have a name before saving')
      return
    }
    setSaving(true)
    try {
      const updated = await saveAdminSettings({
        ...settings,
        culturalsTitle: title.trim(),
        culturalsArtists: artists.map((a, i) => ({ ...a, order: i })),
      })
      setSettings(updated)
      toast.success('Culturals settings saved!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Culturals Management"
        subtitle="Set the page title, add artists, upload posters, and control the reveal"
      />

      {loading ? (
        <div className="bg-[#111] border border-[#333] rounded-lg p-8 text-center text-gray-500 text-sm animate-pulse">
          Loading…
        </div>
      ) : !canManage ? (
        <div className="bg-[#111] border border-[#333] rounded-lg p-6 text-gray-400 text-sm">
          Only Developer Admin can manage Culturals settings.
        </div>
      ) : (
        <div className="space-y-5">

          {/* Storage info banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl text-xs text-blue-300 border border-blue-500/20 bg-blue-500/5">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
            <div>
              <strong>Image Storage:</strong> Images are uploaded directly to your <strong>Supabase Storage</strong> bucket named <code className="bg-blue-400/10 px-1 py-0.5 rounded">culturals</code>.
              You need to create this bucket in your Supabase dashboard with <strong>public</strong> access before using the Upload button.
              Alternatively, paste any public image URL directly.
            </div>
          </div>

          {/* Page Title */}
          <div className="bg-[#111] border border-[#333] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Type className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-semibold text-sm">Page Title</h3>
            </div>
            <p className="text-xs text-gray-500">Displayed as the large heading on the public Culturals page.</p>
            <Input
              id="culturals-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cultural Night 2026"
              className="bg-black border-[#2a2a2a] text-white placeholder:text-gray-700"
            />
            {title && (
              <p className="text-[10px] text-gray-500">
                Preview: <span className="text-[#D4AF37] font-semibold">{title}</span>
              </p>
            )}
          </div>

          {/* Artists List */}
          <div className="bg-[#111] border border-[#333] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Music2 className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-semibold text-sm">Artists</h3>
                <span className="text-xs text-gray-500 ml-1">({artists.length})</span>
              </div>
              <Button
                size="sm"
                className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-xs h-8"
                onClick={addArtist}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Artist
              </Button>
            </div>

            {artists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-[#2a2a2a] rounded-xl">
                <Music2 className="w-8 h-8 text-gray-700" />
                <p className="text-sm text-gray-600">No artists yet</p>
                <button
                  onClick={addArtist}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add your first artist
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {artists.map((artist, i) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    index={i}
                    total={artists.length}
                    onChange={(updated) => updateArtist(artist.id, updated)}
                    onRemove={() => removeArtist(artist.id)}
                    onMoveUp={() => moveArtist(i, 'up')}
                    onMoveDown={() => moveArtist(i, 'down')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3">
            <Button
              className="flex-1 bg-[#D4AF37] text-black hover:bg-[#c9a227] font-bold tracking-wide"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save All Changes
                </span>
              )}
            </Button>

            <a
              href="/culturals"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#D4AF37] border border-[#D4AF37]/25 rounded-lg px-4 py-2.5 hover:bg-[#D4AF37]/10 transition whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview page
            </a>
          </div>

          {/* Quick status */}
          {artists.length > 0 && (
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Artist Status</p>
              <div className="space-y-2">
                {artists.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600 font-mono w-6">#{i + 1}</span>
                    <span className="text-white flex-1 truncate">{a.name || '— unnamed —'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${a.imageUrl ? 'border-green-500/25 bg-green-500/10 text-green-400' : 'border-gray-700 text-gray-600'}`}>
                      {a.imageUrl ? 'Image ✓' : 'No image'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${a.revealed ? 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 text-gray-600'}`}>
                      {a.revealed ? '🔓 Revealed' : '🔒 Hidden'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
