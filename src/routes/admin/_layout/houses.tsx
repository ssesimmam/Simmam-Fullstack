import { createFileRoute } from '@tanstack/react-router'
import PageHeader from '@/components/admin/shared/PageHeader'

export const Route = createFileRoute('/admin/_layout/houses')({
  component: HousesPage,
})

function HousesPage() {
  return (
    <div>
      <PageHeader title="Houses" subtitle="Manage houses and points" />

      <div className="rounded-lg border border-[#333] bg-[#111] p-6">
        <p className="text-sm text-gray-400">House management UI will go here.</p>
      </div>
    </div>
  )
}
