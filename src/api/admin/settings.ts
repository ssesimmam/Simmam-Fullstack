import { adminRequest, apiBase } from '../client'
import supabase from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CulturalsArtist {
  id: string
  name: string
  description?: string
  imageUrl?: string
  uploadedAt?: number
  revealed?: boolean
  order?: number
}

export interface Award {
  id: string
  awardTitle: string
  winnerName: string
  category: string
  mysteryIcon: string
  department?: string
  achievement?: string
  posterSrc?: string
  revealed?: boolean
  revealAt?: string
  order?: number
}

export interface AdminSettings {
  festivalStatus: 'pre' | 'live' | 'post'
  registrationsOpen: boolean
  coordinatorAssignments: Record<string, string>
  houseOfTheDay?: string
  // Culturals
  culturalsTitle?: string
  culturalsArtistRevealed?: boolean   // legacy single-artist flag
  culturalsArtists?: CulturalsArtist[]
  // Awards
  awards?: Award[]
}

// ─── Public Culturals Settings ────────────────────────────────────────────────

export interface PublicCulturalsSettings {
  culturalsTitle?: string
  culturalsArtists?: CulturalsArtist[]
}

export async function getPublicCulturalsSettings(): Promise<PublicCulturalsSettings> {
  try {
    const result = await fetch(`${apiBase}/settings`)
    const json = await result.json()
    const s = json?.settings || {}
    return {
      culturalsTitle: s.culturalsTitle || s.culturals_title || '',
      culturalsArtists: (s.culturalsArtists as CulturalsArtist[] | undefined) || [],
    }
  } catch {
    return {}
  }
}

export async function getPublicSettings(): Promise<{ awards?: Award[] }> {
  try {
    const result = await fetch(`${apiBase}/settings`)
    const json = await result.json()
    const settings = json?.settings || {}

    // Only fall back to Supabase if awards is truly absent (undefined/null) from the API
    // response. An empty array [] means admin cleared all awards intentionally — respect that.
    if (settings.awards == null) {
      const { data } = await supabase
        .from('admin_settings')
        .select('awards')
        .limit(1)
        .single()
      settings.awards = (data as any)?.awards ?? []
    }

    return settings
  } catch {
    // Final fallback: try to read awards directly from Supabase
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('awards')
        .limit(1)
        .single()
      return { awards: (data as any)?.awards ?? [] }
    } catch {
      return { awards: [] }
    }
  }
}


// ─── Supabase Storage Image Upload ────────────────────────────────────────────

export async function uploadCulturalsImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `artist-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `artists/${filename}`

  const { error } = await supabase.storage
    .from('culturals')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('culturals').getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('Failed to get public URL')
  return data.publicUrl
}

export async function deleteCulturalsImage(url: string): Promise<void> {
  try {
    const match = url.match(/culturals\/(artists\/.*)$/)
    if (!match || !match[1]) return

    const path = match[1]
    const { error } = await supabase.storage.from('culturals').remove([path])
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('Failed to delete image:', err)
    throw err
  }
}

// ─── Supabase Storage Image Upload (Awards) ───────────────────────────────────

export async function uploadAwardImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `award-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `posters/${filename}`

  const { error } = await supabase.storage
    .from('awards')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('awards').getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('Failed to get public URL')
  return data.publicUrl
}

export async function deleteAwardImage(url: string): Promise<void> {
  try {
    const match = url.match(/awards\/(posters\/.*)$/)
    if (!match || !match[1]) return

    const path = match[1]
    const { error } = await supabase.storage.from('awards').remove([path])
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('Failed to delete image:', err)
    throw err
  }
}


// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAdminSettings(): Promise<AdminSettings> {
  const result = await adminRequest<{ settings: AdminSettings }>('/settings')
  return result.settings
}

export async function saveAdminSettings(settings: AdminSettings): Promise<AdminSettings> {
  const result = await adminRequest<{ settings: AdminSettings }>('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  })
  return result.settings
}
