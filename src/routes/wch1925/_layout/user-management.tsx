import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Search, Trash2, Users } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { createAdminUser, deleteAdminUser, updateAdminUser, fetchAdminUserDetails, fetchAdminUsers, type AdminUserRow } from '@/lib/adminApi'
import { useData } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/user-management')({
  component: UserManagementPage,
})

function UserManagementPage() {
  const { hasPermission } = useAuth()
  const { houses } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [houseFilter, setHouseFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    register_number: '',
    house: '',
    mobile_number: '',
  })

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    register_number: '',
    house: '',
  })

  if (!hasPermission('users', 'read')) {
    return <AccessDenied />
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const rows = await fetchAdminUsers({
        search: searchQuery || undefined,
        house: houseFilter !== 'all' ? houseFilter : undefined,
      })
      setUsers(rows)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.user_id.toLowerCase().includes(query),
    )
  }, [users, searchQuery])

  const handleViewDetails = async (userId: string) => {
    try {
      const details = await fetchAdminUserDetails(userId)
      setSelectedUserId(userId)
      setSelectedUserDetails(details)
      setIsEditing(false)
      setEditForm({
        name: details.user.name,
        email: details.user.email,
        register_number: details.user.register_number || '',
        house: details.user.house || '',
      })
    } catch (error: any) {
      toast.error(error?.message || 'Unable to load user details')
    }
  }

  const handleSaveUser = async () => {
    if (!selectedUserId) return
    try {
      await updateAdminUser(selectedUserId, {
        name: editForm.name,
        email: editForm.email,
        register_number: editForm.register_number,
        house: editForm.house,
      })
      toast.success('User updated successfully')
      setIsEditing(false)
      await loadUsers()
      await handleViewDetails(selectedUserId)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user')
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.register_number.trim() || !createForm.house.trim()) {
      toast.error('Name, email, register number, and house are required')
      return
    }

    if (!/^[^\s@]+@saveetha\.com$/i.test(createForm.email.trim())) {
      toast.error('Use a valid @saveetha.com email address')
      return
    }

    try {
      await createAdminUser({
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        register_number: createForm.register_number.trim(),
        house: createForm.house.trim(),
        mobile_number: createForm.mobile_number.trim() || undefined,
      })
      toast.success('User saved successfully')
      setIsCreating(false)
      setCreateForm({ name: '', email: '', register_number: '', house: '', mobile_number: '' })
      await loadUsers()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!hasPermission('users', 'delete')) {
      toast.error('You do not have permission to delete users')
      return
    }

    if (!window.confirm('Delete this user and all related registrations?')) {
      return
    }

    try {
      await deleteAdminUser(userId)
      toast.success('User deleted successfully')
      if (selectedUserId === userId) {
        setSelectedUserId(null)
        setSelectedUserDetails(null)
      }
      await loadUsers()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Search, filter, view and delete participant accounts" />

      <div className="bg-[#111] border border-[#333] rounded-lg p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users by register no, name or email"
              className="pl-10 bg-black border-[#333] text-white"
            />
          </div>

          <Select value={houseFilter} onValueChange={setHouseFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-black border-[#333] text-white">
              <SelectValue placeholder="Filter by house" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Houses</SelectItem>
              {houses.map((house) => (
                <SelectItem key={house.name} value={house.name}>
                  {house.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('users', 'create') && (
            <Button className="bg-[#D4AF37] text-black hover:bg-[#e0bd55]" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          )}
          <Button className="bg-white text-black hover:bg-gray-200" onClick={loadUsers}>
            Search
          </Button>
        </div>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Users</span>
          </div>
          <span className="text-xs text-gray-500">{filteredUsers.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-gray-400">
              <tr>
                <th className="text-left p-3">Register No</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email Address</th>
                <th className="text-left p-3">House</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-t border-[#222] text-white/90">
                    <td className="p-3 font-mono text-xs text-gray-400">{user.register_number || '-'}</td>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3 text-gray-300">{user.email}</td>
                    <td className="p-3">{user.house || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#333]"
                          onClick={() => handleViewDetails(user.user_id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {hasPermission('users', 'delete') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteUser(user.user_id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-[#111] border-[#333] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-black border border-[#333] rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Name</p>
              <Input
                className="bg-black text-white"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="bg-black border border-[#333] rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Email</p>
              <Input
                className="bg-black text-white"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="student@saveetha.com"
              />
            </div>
            <div className="bg-black border border-[#333] rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Register Number</p>
              <Input
                className="bg-black text-white uppercase"
                value={createForm.register_number}
                onChange={(e) => setCreateForm({ ...createForm, register_number: e.target.value })}
                placeholder="192421111"
              />
            </div>
            <div className="bg-black border border-[#333] rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">House</p>
              <Select value={createForm.house} onValueChange={(value) => setCreateForm({ ...createForm, house: value })}>
                <SelectTrigger className="bg-black border-[#333] text-white">
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.name} value={house.name}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-black border border-[#333] rounded-lg p-3 md:col-span-2">
              <p className="text-gray-500 text-xs mb-1">Mobile Number</p>
              <Input
                className="bg-black text-white"
                value={createForm.mobile_number}
                onChange={(e) => setCreateForm({ ...createForm, mobile_number: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-[#333]" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button className="bg-white text-black hover:bg-gray-200" onClick={handleCreateUser}>
              Save User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="bg-[#111] border-[#333] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {selectedUserDetails?.user ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">User Profile</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-black border border-[#333] rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Register No</p>
                  <p className="font-mono mt-1">{selectedUserDetails.user.register_number || '-'}</p>
                </div>
                <div className="bg-black border border-[#333] rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Name</p>
                  {isEditing ? (
                    <Input
                      className="mt-1 bg-black text-white"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{selectedUserDetails.user.name}</p>
                  )}
                </div>
                <div className="bg-black border border-[#333] rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Email</p>
                  {isEditing ? (
                    <Input
                      className="mt-1 bg-black text-white"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{selectedUserDetails.user.email}</p>
                  )}
                </div>
                <div className="bg-black border border-[#333] rounded-lg p-3">
                  <p className="text-gray-500 text-xs">House</p>
                  {isEditing ? (
                    <Input
                      className="mt-1 bg-black text-white"
                      value={editForm.house}
                      onChange={(e) => setEditForm({ ...editForm, house: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{selectedUserDetails.user.house || '-'}</p>
                  )}
                </div>
                {!isEditing && (
                  <div className="bg-black border border-[#333] rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Register Number</p>
                    <p className="mt-1">{selectedUserDetails.user.register_number || '-'}</p>
                  </div>
                )}
                {isEditing && (
                  <div className="bg-black border border-[#333] rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Register Number</p>
                    <Input
                      className="mt-1 bg-black text-white"
                      value={editForm.register_number}
                      onChange={(e) => setEditForm({ ...editForm, register_number: e.target.value })}
                    />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex justify-end">
                  <Button className="bg-white text-black hover:bg-gray-200 px-6" onClick={handleSaveUser}>
                    Save Changes
                  </Button>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Registrations</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(selectedUserDetails.registrations || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No registrations for this user.</p>
                  ) : (
                    selectedUserDetails.registrations.map((registration: any) => (
                      <div key={registration.id} className="bg-black border border-[#333] rounded-lg p-3 text-sm">
                        <p className="text-white">{registration.events?.name || 'Unknown Event'}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {registration.events?.date || '-'} • {registration.status}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading details...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
