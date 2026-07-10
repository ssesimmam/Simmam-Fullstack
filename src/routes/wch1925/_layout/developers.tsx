import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { 
  getDevelopers, 
  DeveloperStatus, 
  toggleDeveloperLogin, 
  getDeveloperTasks, 
  DeveloperTask, 
  addDeveloperTask, 
  updateTaskStatus 
} from '@/api/admin/developers'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/wch1925/_layout/developers')({
  component: DevelopersPage,
})

function DeveloperCard({ 
  dev, 
  isAdmin, 
  onToggleStatus 
}: { 
  dev: DeveloperStatus, 
  isAdmin: boolean,
  onToggleStatus: (devId: string, currentStatus: boolean, name: string, reason?: string) => void
}) {
  const [tasks, setTasks] = useState<DeveloperTask[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [logoutReason, setLogoutReason] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [dev.id])

  const fetchTasks = async () => {
    try {
      const data = await getDeveloperTasks(dev.id)
      setTasks(data)
    } catch (err) {
      toast.error('Failed to load tasks for ' + dev.name)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      setLoading(true)
      const task = await addDeveloperTask(dev.id, newTaskTitle)
      setTasks([task, ...tasks])
      setNewTaskTitle('')
      toast.success('Task added')
    } catch (err) {
      toast.error('Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_process' | 'completed') => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      await updateTaskStatus(taskId, newStatus)
    } catch (err) {
      toast.error('Failed to update status')
      fetchTasks() // revert
    }
  }

  return (
    <div className="bg-[#111] border border-[#333] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">{dev.name}</h3>
          <p className="text-sm text-gray-500">{dev.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${dev.is_logged_in ? 'text-green-500' : 'text-gray-500'}`}>
              {dev.is_logged_in ? 'Logged In' : 'Logged Off'}
            </span>
            <button
              onClick={() => {
                if (dev.is_logged_in) {
                  setShowLogoutModal(true)
                } else {
                  onToggleStatus(dev.id, dev.is_logged_in, dev.name)
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dev.is_logged_in ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dev.is_logged_in ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="bg-[#111] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>Reason for logging out</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={logoutReason}
              onChange={(e) => setLogoutReason(e.target.value)}
              placeholder="Why are you logging out right now?"
              className="w-full bg-black border border-[#333] rounded-md p-3 text-sm text-white min-h-[100px] focus:outline-none focus:border-gray-500"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!logoutReason.trim()) {
                  toast.error("Reason is required")
                  return
                }
                onToggleStatus(dev.id, dev.is_logged_in, dev.name, logoutReason)
                setShowLogoutModal(false)
                setLogoutReason('')
              }}
              className="px-4 py-2 rounded text-sm bg-white text-black font-medium hover:bg-gray-200"
            >
              Confirm Log Out
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border-t border-[#333] pt-4 mt-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Tasks ({tasks.length})
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {isAdmin && (
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="New task..."
                  className="flex-1 bg-black border border-[#333] rounded px-3 py-1 text-sm text-white"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  disabled={loading || !newTaskTitle.trim()}
                  className="bg-white text-black px-3 py-1 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={16} /> Add
                </button>
              </form>
            )}

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No tasks assigned.</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-black border border-[#333] p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-sm text-gray-300">{task.title}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'pending'}
                          onChange={() => handleStatusChange(task.id, 'pending')}
                          className="rounded border-gray-600 bg-black"
                        />
                        Pending
                      </label>
                      <label className="flex items-center gap-1 text-xs text-yellow-500 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'in_process'}
                          onChange={() => handleStatusChange(task.id, 'in_process')}
                          className="rounded border-yellow-600 bg-black"
                        />
                        In Process
                      </label>
                      <label className="flex items-center gap-1 text-xs text-green-500 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'completed'}
                          onChange={() => handleStatusChange(task.id, 'completed')}
                          className="rounded border-green-600 bg-black"
                        />
                        Completed
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DevelopersPage() {
  const { user } = useAuth()
  const [developers, setDevelopers] = useState<DeveloperStatus[]>([])
  const [loading, setLoading] = useState(true)

  const isSasvanthu = user?.email === 'sasvanthu.g.2006@gmail.com'

  useEffect(() => {
    loadDevelopers()
  }, [])

  const loadDevelopers = async () => {
    try {
      setLoading(true)
      const devs = await getDevelopers()
      setDevelopers(devs)
    } catch (err) {
      toast.error('Failed to load developers')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (devId: string, currentStatus: boolean, name: string, reason?: string) => {
    try {
      // Optimistic update
      setDevelopers(developers.map(d => d.id === devId ? { ...d, is_logged_in: !currentStatus } : d))
      
      await toggleDeveloperLogin(devId, currentStatus, name, reason)
      if (currentStatus) {
        toast.success(`Logged out successfully`)
      } else {
        toast.success(`Logged in. Email notification sent.`)
      }
    } catch (err) {
      toast.error('Failed to toggle status')
      loadDevelopers() // revert
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-wider mb-2">Developers</h1>
        <p className="text-gray-400">Manage developer tasks and login status.</p>
      </div>

      <div className="space-y-4">
        {developers.map(dev => (
          <DeveloperCard 
            key={dev.id} 
            dev={dev} 
            isAdmin={isSasvanthu}
            onToggleStatus={handleToggleStatus}
          />
        ))}

        {developers.length === 0 && (
          <div className="bg-[#111] border border-[#333] rounded-lg p-8 text-center text-gray-500">
            No developers found.
          </div>
        )}
      </div>
    </div>
  )
}
