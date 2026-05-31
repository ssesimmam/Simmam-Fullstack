import { adminRequest } from '../client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminLeaderboardDTO {
  house_id: string
  house_name: string
  base_points?: number
  bonus_points?: number
  total_points: number
}

export interface AdminHouseDTO {
  id: string
  name: string
  accent?: string | null
  points: number
}

export interface AdminDashboardSummary {
  totals: { users: number; events: number; registrations: number; attendance: number }
  upcomingEvents: Array<{ id: string; name: string; date: string; time_slot: string; venue: string }>
  recentRegistrations: Array<{
    id: string
    registration_date: string
    registration_status: string
    participant_name: string
    user_email: string
    event_name: string
    event_date: string
    event_time: string
  }>
}

export interface AttendanceReportDTO {
  event_name: string
  event_date: string
  total: number
  checked_in: number
  attendance_rate: number
}

export interface DepartmentAnalyticsDTO {
  department: string
  house_name: string
  total_registrations: number
  percentage: number
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAdminLeaderboard(): Promise<AdminLeaderboardDTO[]> {
  const result = await adminRequest<{ data: AdminLeaderboardDTO[] }>('/leaderboard')
  return result.data ?? []
}

export async function adjustLeaderboardPoints(houseId: string, points: number, reason?: string): Promise<void> {
  await adminRequest('/leaderboard/adjust', {
    method: 'POST',
    body: JSON.stringify({ house_id: houseId, points, reason }),
  })
}

export async function getAdminHouses(): Promise<AdminHouseDTO[]> {
  const result = await adminRequest<{ data: AdminHouseDTO[] }>('/houses')
  return result.data ?? []
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  return adminRequest<AdminDashboardSummary>('/dashboard-summary')
}

export async function getAttendanceReport(): Promise<AttendanceReportDTO[]> {
  const result = await adminRequest<{ data: AttendanceReportDTO[] }>('/attendance-report')
  return result.data ?? []
}

export async function getDepartmentAnalytics(): Promise<DepartmentAnalyticsDTO[]> {
  const result = await adminRequest<{ data: DepartmentAnalyticsDTO[] }>('/department-analytics')
  return result.data ?? []
}
