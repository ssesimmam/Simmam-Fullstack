export type AdminRole = 'core_team' | 'reg_team' | 'developer_admin'

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
  core_team: [
    { resource: 'participants', actions: ['read'] },
    { resource: 'leaderboard', actions: ['read'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'registrations', actions: ['read'] },
  ],
  reg_team: [
    { resource: 'checkin', actions: ['read', 'create', 'update', 'delete'] },
  ],
  developer_admin: [
    { resource: 'events', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'participants', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'checkin', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'data-entry', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'leaderboard', actions: ['read', 'update'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'users', actions: ['read', 'create', 'delete'] },
    { resource: 'announcements', actions: ['read', 'create', 'delete'] },
    { resource: 'rules', actions: ['read', 'create', 'delete'] },
    { resource: 'registrations', actions: ['read', 'export'] },
  ],
}

export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/wch1925/events': [{ resource: 'events', actions: ['read'] }],
  '/wch1925/participants': [{ resource: 'participants', actions: ['read'] }],
  '/wch1925/checkin': [{ resource: 'checkin', actions: ['read'] }],
  '/wch1925/data-entry': [{ resource: 'data-entry', actions: ['read'] }],
  '/wch1925/leaderboard': [{ resource: 'leaderboard', actions: ['read'] }],
  '/wch1925/settings': [{ resource: 'settings', actions: ['read'] }],
  '/wch1925/user-management': [{ resource: 'users', actions: ['read'] }],
  '/wch1925/registrations': [{ resource: 'registrations', actions: ['read'] }],
  '/wch1925/announcements': [{ resource: 'announcements', actions: ['read'] }],
  '/wch1925/rules': [{ resource: 'rules', actions: ['read'] }],
}
