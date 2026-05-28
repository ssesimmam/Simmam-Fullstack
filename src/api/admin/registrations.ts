import { adminRequest } from '../client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminRegistrationDTO {
  registration_id: string
  user_id: string
  participant_name: string
  email: string
  reg_no?: string
  house?: string
  event_id: string
  event_name: string
  event_date: string
  registration_date: string
  registration_status: string
  checked_in?: boolean
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAdminRegistrations(params?: { search?: string; event?: string; date?: string }): Promise<AdminRegistrationDTO[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.event) query.set('event', params.event)
  if (params?.date) query.set('date', params.date)
  const suffix = query.toString() ? `?${query}` : ''
  const result = await adminRequest<{ data: AdminRegistrationDTO[] }>(`/registrations${suffix}`)
  return result.data ?? []
}

export async function createAdminParticipant(payload: {
  email: string
  name: string
  register_number?: string
  house?: string
  event_id?: string
  event_name?: string
}): Promise<AdminRegistrationDTO> {
  const result = await adminRequest<{ data: AdminRegistrationDTO }>('/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function updateAdminParticipant(registrationId: string, payload: {
  status?: string
  event_id?: string
  event_name?: string
  email?: string
  name?: string
  register_number?: string
  house?: string
}): Promise<AdminRegistrationDTO> {
  const result = await adminRequest<{ data: AdminRegistrationDTO }>(`/registrations/${encodeURIComponent(registrationId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return result.data
}

export async function deleteAdminRegistration(registrationId: string): Promise<void> {
  await adminRequest(`/registrations/${encodeURIComponent(registrationId)}`, { method: 'DELETE' })
}

export async function exportAdminRegistrationsCsv(params?: { search?: string; event?: string; date?: string }): Promise<string> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.event) query.set('event', params.event)
  if (params?.date) query.set('date', params.date)
  const suffix = query.toString() ? `?${query}` : ''
  return adminRequest<string>(`/registrations/export.csv${suffix}`)
}

export async function checkInRegistration(registrationId: string): Promise<void> {
  await adminRequest('/checkin', {
    method: 'POST',
    body: JSON.stringify({ registration_id: registrationId, device_info: 'admin_panel' }),
  })
}

export async function removeAdminCheckin(registrationId: string): Promise<void> {
  await adminRequest(`/checkin/${encodeURIComponent(registrationId)}`, { method: 'DELETE' })
}
