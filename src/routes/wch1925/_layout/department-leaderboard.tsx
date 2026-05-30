import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useEffect, useState } from 'react'
import { useHouses } from '@/features/events/useEvents'

export const Route = createFileRoute('/wch1925/_layout/department-leaderboard')({
  component: DepartmentLeaderboard,
})

type Row = {
  house_name: string
  department: string
  participation_count: number
}

function DepartmentLeaderboard() {
  const { hasPermission } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canRead = hasPermission('leaderboard', 'read')

  useEffect(() => {
    if (!canRead) return

    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: rpcError } = await supabase.rpc('get_house_department_participation')
        if (rpcError) throw rpcError
        if (!mounted) return
        setRows((data as Row[]) || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load participation data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [canRead])

  if (!canRead) return <AccessDenied />

  // Group rows by house
  const housesByName = rows.reduce<Record<string, Row[]>>((acc, r) => {
    acc[r.house_name] = acc[r.house_name] || []
    acc[r.house_name].push(r)
    return acc
  }, {})

  // Use canonical six-house ordering when available
  const { data: houseList = [] } = useHouses()
  const canonicalHouseNames = houseList.map((h: any) => h.name)

  // If canonical names exist, use them in that order; otherwise use found house keys
  const houseKeys = (canonicalHouseNames.length > 0 ? canonicalHouseNames : Object.keys(housesByName)).filter(
    (hn) => hn in housesByName
  )

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Department Leaderboard" subtitle="Universal participation counts grouped by house and department" />

      {loading && (
        <div className="rounded-lg border border-[#333] bg-[#111] p-4 text-sm text-gray-400">Loading department participation…</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-700 bg-[#111] p-4 text-sm text-red-400">Error: {error}</div>
      )}

      <div className="grid gap-6">
        {houseKeys.length === 0 && !loading && !error && (
          <div className="rounded-lg border border-[#333] bg-[#111] p-4 text-sm text-gray-400">No participation data available.</div>
        )}

        {houseKeys.map((houseName) => (
          <div key={houseName} className="bg-[#111] border border-[#333] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">{houseName}</h3>

            <div className="space-y-2">
              {(housesByName[houseName] || [])
                .sort((a, b) => b.participation_count - a.participation_count)
                .map((d) => (
                <div key={d.department} className="flex items-center justify-between gap-4 bg-black border border-[#222] p-3 rounded-md">
                  <div className="flex-1">
                    <div className="text-sm text-gray-300 font-medium">{d.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{Number(d.participation_count).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Participants</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
