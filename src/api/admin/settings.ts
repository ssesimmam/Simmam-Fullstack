import { adminRequest } from '../client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSettings {
  festivalStatus: 'pre' | 'live' | 'post'
  registrationsOpen: boolean
  coordinatorAssignments: Record<string, string>
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
