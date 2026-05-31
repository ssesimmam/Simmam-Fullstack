/**
 * COMPATIBILITY SHIM — src/lib/adminApi.ts
 *
 * Admin API functions have been migrated to src/api/admin/*.
 * This file re-exports from the new modules for backward compatibility.
 */

export { getAdminEvents as fetchAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent, closeAdminEventRegistration } from '@/api/admin/events'
export { getAdminRegistrations as fetchAdminRegistrations, checkInRegistration, removeAdminCheckin, exportAdminRegistrationsCsv, createAdminParticipant, updateAdminParticipant, deleteAdminRegistration } from '@/api/admin/registrations'
export { getAdminSettings, saveAdminSettings } from '@/api/admin/settings'
export { getAdminHouses as fetchAdminHouses, getAdminLeaderboard as fetchAdminLeaderboard, adjustLeaderboardPoints as adjustAdminLeaderboardPoints, getAdminDashboardSummary as fetchAdminDashboardSummary, getAttendanceReport as fetchAttendanceReport, getDepartmentAnalytics as fetchDepartmentAnalytics } from '@/api/admin/leaderboard'
export { getAdminAnnouncements as fetchAdminAnnouncements, createAdminAnnouncement, updateAdminAnnouncement, deleteAdminAnnouncement } from '@/api/admin/content'
export { getAdminRules as fetchAdminRules, createAdminRule, updateAdminRule, deleteAdminRule } from '@/api/admin/content'
export { getAdminUsers as fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getAdminUserDetails as fetchAdminUserDetails } from '@/api/admin/users'

export type { AdminSettings } from '@/api/admin/settings'
export type { AdminEventDTO as AdminEventRow } from '@/api/admin/events'
export type { AdminRegistrationDTO as AdminRegistrationRow } from '@/api/admin/registrations'
export type { AdminUserDTO as AdminUserRow } from '@/api/admin/users'
export type { AdminLeaderboardDTO as AdminLeaderboardRow, AdminDashboardSummary, AttendanceReportDTO, DepartmentAnalyticsDTO } from '@/api/admin/leaderboard'
export type { AdminAnnouncementDTO as AdminAnnouncementRow, AdminRuleDTO as AdminRuleRow } from '@/api/admin/content'
