import { adminRequest } from '../client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminAnnouncementDTO {
  id: string
  title: string
  body?: string | null
  pinned?: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface AdminRuleDTO {
  id: string
  title: string
  body?: string | null
  pinned?: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at?: string
  updated_at?: string
}

// ─── Announcement Functions ───────────────────────────────────────────────────

export async function getAdminAnnouncements(): Promise<AdminAnnouncementDTO[]> {
  const result = await adminRequest<{ data: AdminAnnouncementDTO[] }>('/announcements')
  return result.data ?? []
}

export async function createAdminAnnouncement(payload: {
  title: string; body?: string | null; pinned?: boolean; starts_at?: string | null; ends_at?: string | null
}): Promise<AdminAnnouncementDTO> {
  const result = await adminRequest<{ data: AdminAnnouncementDTO }>('/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function updateAdminAnnouncement(id: string, payload: {
  title: string; body?: string | null; pinned?: boolean; starts_at?: string | null; ends_at?: string | null
}): Promise<AdminAnnouncementDTO> {
  const result = await adminRequest<{ data: AdminAnnouncementDTO }>(`/announcements/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function deleteAdminAnnouncement(id: string): Promise<void> {
  await adminRequest(`/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ─── Rules Functions ──────────────────────────────────────────────────────────

export async function getAdminRules(): Promise<AdminRuleDTO[]> {
  const result = await adminRequest<{ data: AdminRuleDTO[] }>('/rules')
  return result.data ?? []
}

export async function createAdminRule(payload: {
  title: string; body?: string | null; pinned?: boolean; starts_at?: string | null; ends_at?: string | null
}): Promise<AdminRuleDTO> {
  const result = await adminRequest<{ data: AdminRuleDTO }>('/rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function updateAdminRule(id: string, payload: {
  title: string; body?: string | null; pinned?: boolean; starts_at?: string | null; ends_at?: string | null
}): Promise<AdminRuleDTO> {
  const result = await adminRequest<{ data: AdminRuleDTO }>(`/rules/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function deleteAdminRule(id: string): Promise<void> {
  await adminRequest(`/rules/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
