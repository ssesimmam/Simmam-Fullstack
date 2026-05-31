import { adminRequest } from '../client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserDTO {
  user_id: string
  name: string
  email: string
  house: string
  department?: string
  register_number: string
  created_at: string
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAdminUsers(params?: { search?: string; house?: string }): Promise<AdminUserDTO[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.house) query.set('house', params.house)
  const suffix = query.toString() ? `?${query}` : ''
  const result = await adminRequest<{ data: AdminUserDTO[] }>(`/users${suffix}`)
  return result.data ?? []
}

export async function getAdminUserDetails(userId: string): Promise<{ user: AdminUserDTO; registrations: unknown[] }> {
  return adminRequest<{ user: AdminUserDTO; registrations: unknown[] }>(`/users/${encodeURIComponent(userId)}`)
}

export async function createAdminUser(payload: {
  name: string
  email: string
  mobile_number?: string
  register_number?: string
  house?: string
  department?: string
  picture_url?: string
}): Promise<AdminUserDTO> {
  const result = await adminRequest<{ user: AdminUserDTO }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result.user
}

export async function updateAdminUser(userId: string, payload: {
  name?: string
  email?: string
  register_number?: string
  house?: string
  department?: string
  picture_url?: string
}): Promise<AdminUserDTO> {
  const result = await adminRequest<{ user: AdminUserDTO }>(`/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return result.user
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await adminRequest(`/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}
