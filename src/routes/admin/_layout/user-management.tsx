import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useState } from 'react'
import { 
  ShieldCheck, 
  Lock,
  Trash2,
  UserPlus,
  Search,
  Users
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/_layout/user-management')({
  component: UserManagementPage,
})

// Mock staff list — in production this would come from your auth/user store
const STAFF_LIST = [
  { id: '1', name: 'Shaik Abdul Hussain', role: 'Staff Coordinator' },
  { id: '2', name: 'Libhika', role: 'Student Coordinator' },
  { id: '3', name: 'Nithish Kumar', role: 'Student Coordinator' },
  { id: '4', name: 'Dharshan', role: 'Staff Coordinator' },
  { id: '5', name: 'Priya Sharma', role: 'Student Coordinator' },
]

interface Assignment {
  staffId: string
  staffName: string
  eventId: string
  eventName: string
  assignedAt: string
}

function UserManagementPage() {
  const { hasPermission } = useAuth()
  const { events, settings, updateSettings } = useData()

  // Local assignment state
  const [assignments, setAssignments] = useState<Assignment[]>([
    { staffId: '1', staffName: 'Shaik Abdul Hussain', eventId: 'event-0', eventName: 'Basketball', assignedAt: new Date().toISOString() },
    { staffId: '2', staffName: 'Libhika', eventId: 'event-1', eventName: 'Volleyball', assignedAt: new Date().toISOString() },
    { staffId: '3', staffName: 'Nithish Kumar', eventId: 'event-2', eventName: 'Tennis', assignedAt: new Date().toISOString() },
  ])

  const [selectedStaff, setSelectedStaff] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  if (!hasPermission('settings', 'read')) {
    return <AccessDenied />
  }

  const handleAssign = () => {
    if (!selectedStaff || !selectedEvent) {
      toast.error('Please select both a coordinator and an event')
      return
    }

    const staff = STAFF_LIST.find(s => s.id === selectedStaff)
    const event = events.find(e => e.id === selectedEvent)

    if (!staff || !event) return

    // Check for duplicate assignment
    const exists = assignments.find(a => a.staffId === selectedStaff && a.eventId === selectedEvent)
    if (exists) {
      toast.error(`${staff.name} is already assigned to ${event.name}`)
      return
    }

    const newAssignment: Assignment = {
      staffId: selectedStaff,
      staffName: staff.name,
      eventId: selectedEvent,
      eventName: event.name,
      assignedAt: new Date().toISOString(),
    }

    setAssignments([...assignments, newAssignment])
    
    // Also update settings store for coordinator assignments
    const updatedCoordAssignments = {
      ...settings.coordinatorAssignments,
      [staff.name]: event.name,
    }
    updateSettings({ ...settings, coordinatorAssignments: updatedCoordAssignments })

    setSelectedStaff('')
    setSelectedEvent('')
    toast.success(`${staff.name} assigned to ${event.name}`)
  }

  const handleRemoveAssignment = (assignment: Assignment) => {
    setAssignments(assignments.filter(a => 
      !(a.staffId === assignment.staffId && a.eventId === assignment.eventId)
    ))

    // Update settings store
    const updatedCoordAssignments = { ...settings.coordinatorAssignments }
    delete updatedCoordAssignments[assignment.staffName]
    updateSettings({ ...settings, coordinatorAssignments: updatedCoordAssignments })

    toast.success(`Removed ${assignment.staffName} from ${assignment.eventName}`)
  }

  // Group assignments by staff
  const staffGrouped = STAFF_LIST.map(staff => ({
    ...staff,
    assignedEvents: assignments.filter(a => a.staffId === staff.id),
  }))

  const filteredStaff = staffGrouped.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.assignedEvents.some(a => a.eventName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="User Management"
        subtitle="Assign coordinators to specific events and manage roles"
      />

      {/* Assignment Form */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#333] pb-4">
          <div className="p-2 bg-black rounded-lg text-gray-300">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">New Assignment</h3>
            <p className="text-sm text-gray-500">Assign a coordinator to manage a specific event</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Coordinator</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="bg-black border-[#333] h-10 text-white">
                <SelectValue placeholder="Select staff/student..." />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333]">
                {STAFF_LIST.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <span>{staff.name}</span>
                      <span className="text-gray-500 text-xs">({staff.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="bg-black border-[#333] h-10 text-white">
                <SelectValue placeholder="Choose event..." />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#333] max-h-[250px]">
                {events.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAssign}
            className="bg-white text-black font-semibold h-10 hover:bg-gray-200 transition"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search coordinators or events..."
          className="pl-10 bg-black border-[#333] text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Coordinator Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Active Coordinators ({assignments.length} assignment{assignments.length !== 1 ? 's' : ''})
          </h3>
        </div>

        <div className="grid gap-4">
          {filteredStaff.map(staff => (
            <div key={staff.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black border border-[#333] flex items-center justify-center text-white font-bold text-sm">
                    {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{staff.name}</div>
                    <div className="text-gray-500 text-xs">{staff.role}</div>
                  </div>
                </div>
                <div className="text-gray-500 text-sm">
                  {staff.assignedEvents.length} event{staff.assignedEvents.length !== 1 ? 's' : ''}
                </div>
              </div>

              {staff.assignedEvents.length > 0 && (
                <div className="border-t border-[#333] bg-black/50">
                  {staff.assignedEvents.map((assignment) => (
                    <div 
                      key={`${assignment.staffId}-${assignment.eventId}`}
                      className="flex items-center justify-between px-4 py-3 border-b border-[#222] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-300">{assignment.eventName}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleRemoveAssignment(assignment)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {staff.assignedEvents.length === 0 && (
                <div className="border-t border-[#333] px-4 py-3">
                  <p className="text-xs text-gray-600 italic">No events assigned</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
