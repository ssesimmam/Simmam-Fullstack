import { createFileRoute } from '@tanstack/react-router'
import PageHeader from '@/components/admin/shared/PageHeader'

export const Route = createFileRoute('/admin/_layout/announcements')({
  component: AnnouncementsPage,
})

function AnnouncementsPage() {
  return (
    <div>
      <PageHeader title="Announcements" subtitle="Create and push announcements" />

      <div className="rounded-lg border border-[#333] bg-[#111] p-6">
        <p className="text-sm text-gray-400">Announcements management UI will go here.</p>
      </div>
    </div>
  )
}
