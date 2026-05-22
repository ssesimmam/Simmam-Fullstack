import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'

export const Route = createFileRoute('/wch1925/_layout/houses')({
  component: HousesPage,
})

function HousesPage() {
  const { hasPermission } = useAuth()
  const { houses } = useData()

  if (!hasPermission('houses', 'read')) {
    return <AccessDenied />
  }

  const totalPoints = houses.reduce((sum, house) => sum + (house.points2026 ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Houses" subtitle="Manage houses and points" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#333] bg-[#111] p-6">
          <p className="text-sm text-gray-400">Total houses in the system</p>
          <p className="mt-3 text-4xl font-bold text-white">{houses.length}</p>
        </div>
        <div className="rounded-lg border border-[#333] bg-[#111] p-6 lg:col-span-2">
          <p className="text-sm text-gray-400">Combined house points</p>
          <p className="mt-3 text-4xl font-bold text-white">{totalPoints}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {houses.map((house) => (
          <div key={house.short || house.name} className="rounded-xl border border-[#333] bg-[#111] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">{house.name}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{house.points2026 ?? 0}</p>
              </div>
              <div
                className="h-12 w-12 rounded-full border border-white/10"
                style={{ backgroundColor: house.accent || '#888' }}
              />
            </div>
            <div className="mt-4 text-sm text-gray-400">
              House accent color and current backend point totals are loaded from the admin API.
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
