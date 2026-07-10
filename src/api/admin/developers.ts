import supabase from '@/lib/supabase'
import type { AdminUserDTO } from './users'

export interface DeveloperTask {
  id: string
  developer_id: string
  title: string
  status: 'pending' | 'in_process' | 'completed'
  created_by: string
  created_at: string
  updated_at: string
}

export interface DeveloperStatus {
  id: string
  user_id: string
  name: string
  email: string
  is_logged_in: boolean
  role: string
}

// Fetch all users with developer_admin role along with their status
export async function getDevelopers(): Promise<DeveloperStatus[]> {
  const { data, error } = await supabase
    .from('admins')
    .select(`
      id,
      role,
      is_logged_in,
      users ( id, name, email )
    `)
    .eq('role', 'developer_admin')

  if (error) {
    console.error('Failed to fetch developers:', error)
    throw new Error('Failed to fetch developers')
  }

  return (data || []).map((admin: any) => ({
    id: admin.id,
    user_id: admin.users?.id || '',
    name: admin.users?.name || 'Unknown User',
    email: admin.users?.email || 'Unknown Email',
    is_logged_in: admin.is_logged_in,
    role: admin.role,
  }))
}

// Toggle login status
export async function toggleDeveloperLogin(adminId: string, currentStatus: boolean, name: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('admins')
    .update({ is_logged_in: !currentStatus })
    .eq('id', adminId)

  if (error) {
    console.error('Failed to toggle login status:', error)
    throw new Error('Failed to toggle login status')
  }

  // If logging OUT (currentStatus was true), insert the reason and skip email
  if (currentStatus) {
    if (reason) {
      const { error: logError } = await supabase
        .from('developer_logout_logs')
        .insert({
          admin_id: adminId,
          reason
        })
      if (logError) console.error('Failed to log logout reason:', logError)
    }
    return // Skip email when logging out
  }

  // Insert a login log record
  const { error: loginLogError } = await supabase
    .from('developer_login_logs')
    .insert({
      admin_id: adminId
    })
  if (loginLogError) console.error('Failed to log login:', loginLogError)

  // Send Email using EmailJS REST API (Only when logging IN)
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  if (serviceId && templateId && publicKey) {
    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: 'ssesimmam@gmail.com',
            developer_name: name,
            action: 'logged in',
            timestamp: new Date().toLocaleString()
          }
        }),
      })
      console.log('Email sent successfully via EmailJS')
    } catch (err) {
      console.error('Failed to send email:', err)
    }
  } else {
    console.warn('EmailJS environment variables not set. Skipping email.')
  }
}

// Fetch tasks for a specific developer
export async function getDeveloperTasks(adminId: string): Promise<DeveloperTask[]> {
  const { data, error } = await supabase
    .from('developer_tasks')
    .select('*')
    .eq('developer_id', adminId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch developer tasks:', error)
    throw new Error('Failed to fetch developer tasks')
  }

  return data as DeveloperTask[]
}

// Add a new task
export async function addDeveloperTask(adminId: string, title: string): Promise<DeveloperTask> {
  const { data: userAuth } = await supabase.auth.getUser()
  if (!userAuth.user) throw new Error('Not authenticated')

  // Get the app user ID by email since auth.users.id is different from public.users.id
  const { data: appUser, error: appUserError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userAuth.user.email)
    .single()

  if (appUserError || !appUser) {
    throw new Error('Failed to find app user')
  }

  // We need the admin ID of the creator (sasvanthu)
  const { data: adminCreator, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', appUser.id)
    .single()
    
  if (adminError || !adminCreator) {
    throw new Error('Failed to verify admin status')
  }

  const { data, error } = await supabase
    .from('developer_tasks')
    .insert({
      developer_id: adminId,
      title,
      status: 'pending',
      created_by: adminCreator.id
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add task:', error)
    throw new Error('Failed to add task')
  }

  return data as DeveloperTask
}

// Update task status
export async function updateTaskStatus(taskId: string, status: 'pending' | 'in_process' | 'completed'): Promise<void> {
  const { error } = await supabase
    .from('developer_tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    console.error('Failed to update task status:', error)
    throw new Error('Failed to update task status')
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('developer_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Failed to delete task:', error)
    throw new Error('Failed to delete task')
  }
}
