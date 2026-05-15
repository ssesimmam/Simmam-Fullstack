export type AdminRole = 'coordinator' | 'core_team' | 'reg_team' | 'developer_admin'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  assignedEvent?: string
}

export interface Permission {
  resource: string
  actions: string[]
}

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  coordinator: [
    { resource: 'participants', actions: ['read'] },
    { resource: 'leaderboard', actions: ['read'] },
  ],
  core_team: [
    { resource: 'participants', actions: ['read'] },
    { resource: 'leaderboard', actions: ['read'] },
  ],
  reg_team: [
    { resource: 'checkin', actions: ['read', 'create', 'update'] },
  ],
  developer_admin: [
    { resource: 'events', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'participants', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'checkin', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'leaderboard', actions: ['read', 'update'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
}

export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/admin/events': [{ resource: 'events', actions: ['read'] }],
  '/admin/participants': [{ resource: 'participants', actions: ['read'] }],
  '/admin/checkin': [{ resource: 'checkin', actions: ['read'] }],
  '/admin/leaderboard': [{ resource: 'leaderboard', actions: ['read'] }],
  '/admin/settings': [{ resource: 'settings', actions: ['read'] }],
}
