export type AdminRole = 'coordinator' | 'core_team' | 'reg_team' | 'developer_admin'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  assignedEvent?: string // for coordinator role
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
    { resource: 'users', actions: ['read'] },
    { resource: 'registrations', actions: ['read'] },
  ],
  reg_team: [
    { resource: 'checkin', actions: ['read', 'create', 'update'] },
    { resource: 'registrations', actions: ['read'] },
  ],
  developer_admin: [
    { resource: 'events', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'participants', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'checkin', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'leaderboard', actions: ['read', 'update'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'users', actions: ['read', 'delete'] },
    { resource: 'registrations', actions: ['read', 'export'] },
  ],
}

export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/admin/events': [{ resource: 'events', actions: ['read'] }],
  '/admin/participants': [{ resource: 'participants', actions: ['read'] }],
  '/admin/checkin': [{ resource: 'checkin', actions: ['read'] }],
  '/admin/leaderboard': [{ resource: 'leaderboard', actions: ['read'] }],
  '/admin/settings': [{ resource: 'settings', actions: ['read'] }],
  '/admin/user-management': [{ resource: 'users', actions: ['read'] }],
  '/admin/registrations': [{ resource: 'registrations', actions: ['read'] }],
}
