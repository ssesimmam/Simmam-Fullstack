import { adminRequest, apiBase } from '../client'
import supabase from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CulturalsArtist {
  id: string
  name: string
  description?: string
  imageUrl?: string
  revealed?: boolean
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
