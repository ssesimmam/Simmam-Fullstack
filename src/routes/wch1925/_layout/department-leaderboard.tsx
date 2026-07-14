import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { fetchDepartmentAnalytics } from '@/lib/adminApi'
import { useHouses } from '@/features/events/useEvents'

export const Route = createFileRoute('/wch1925/_layout/department-leaderboard')({
  component: DepartmentLeaderboard,
})

type Row = {
  house_name: string
  department: string
  total_registrations: number
  checked_in_count: number
  percentage: number
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
        const data = await fetchDepartmentAnalytics()
        if (!mounted) return
        setRows(data as Row[])
      } catch (e: any) {
        setError(e?.message || 'Failed to load department analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [canRead])

  if (!canRead) return <AccessDenied />

  const { data: houseList = [] } = useHouses()

  const totals = useMemo(() => {
    const departmentMap = new Map<string, { registrations: number; checkedIn: number }>()
    const houseMap = new Map<string, number>()

    for (const row of rows) {
      const prev = departmentMap.get(row.department) ?? { registrations: 0, checkedIn: 0 }
      departmentMap.set(row.department, {
        registrations: prev.registrations + Number(row.total_registrations),
        checkedIn: prev.checkedIn + Number(row.checked_in_count ?? 0),
      })
      houseMap.set(row.house_name, (houseMap.get(row.house_name) || 0) + Number(row.total_registrations))
    }

    const totalRegistrations = [...rows].reduce((sum, row) => sum + Number(row.total_registrations), 0)
    const totalCheckedIn = [...rows].reduce((sum, row) => sum + Number(row.checked_in_count ?? 0), 0)

    return {
      totalRegistrations,
      totalCheckedIn,
      departmentsTracked: departmentMap.size,
      housesTracked: houseMap.size,
      departmentTotals: departmentMap,
      houseTotals: houseMap,
    }
  }, [rows])

  const departmentChartData = useMemo(() => {
    return [...totals.departmentTotals.entries()]
      .map(([department, { registrations, checkedIn }]) => ({ department, registrations, checkedIn }))
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 8)
  }, [totals.departmentTotals])

  const houseChartData = useMemo(() => {
    const canonicalNames = houseList.map((house: any) => house.name)
    const orderedHouseNames = [
      ...canonicalNames.filter((name) => totals.houseTotals.has(name)),
      ...[...totals.houseTotals.keys()].filter((name) => !canonicalNames.includes(name)),
    ]

    return orderedHouseNames.map((houseName) => {
      const house = houseList.find((item: any) => item.name === houseName)
      return {
        name: houseName,
        value: totals.houseTotals.get(houseName) || 0,
        fill: house?.accent || '#D4AF37',
      }
    })
  }, [houseList, totals.houseTotals])

  const rowSummary = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (b.total_registrations !== a.total_registrations) {
        return b.total_registrations - a.total_registrations
      }
      if (a.house_name !== b.house_name) {
        return a.house_name.localeCompare(b.house_name)
      }
      return a.department.localeCompare(b.department)
    })
  }, [rows])

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Department Analytics" subtitle="Registration counts grouped by house and department" />

      {loading && (
        <div className="rounded-lg border border-[#333] bg-[#111] p-4 text-sm text-gray-400">Loading department analytics…</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-700 bg-[#111] p-4 text-sm text-red-400">Error: {error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-lg border border-[#333] bg-[#111] p-4 text-sm text-gray-400">No analytics data available yet.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Total registrations</p>
              <p className="mt-2 text-3xl font-bold text-white">{totals.totalRegistrations.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Total checked in</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{totals.totalCheckedIn.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">
                {totals.totalRegistrations > 0
                  ? `${Math.round((totals.totalCheckedIn / totals.totalRegistrations) * 100)}% check-in rate`
                  : 'No registrations yet'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Departments tracked</p>
              <p className="mt-2 text-3xl font-bold text-white">{totals.departmentsTracked}</p>
            </div>
            <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Houses represented</p>
              <p className="mt-2 text-3xl font-bold text-white">{totals.housesTracked}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5 overflow-hidden">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Top departments</h3>
                  <p className="text-sm text-gray-500">Registrations vs checked-in across all houses</p>
                </div>
                <Badge variant="outline" className="w-fit border-[#333] bg-black text-gray-300">
                  Top 8
                </Badge>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[500px]">
                  <ChartContainer
                    config={{
                      registrations: { label: 'Registrations', color: '#D4AF37' },
                      checkedIn: { label: 'Checked In', color: '#34d399' },
                    }}
                    className="h-[320px] w-full"
                  >
                    <BarChart data={departmentChartData} margin={{ left: 4, right: 4, top: 16 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#2b2b2b" />
                      <XAxis dataKey="department" tickLine={false} axisLine={false} stroke="#8b8b8b" tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} stroke="#8b8b8b" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#9ca3af' }} />
                      <Bar dataKey="registrations" name="Registrations" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="checkedIn" name="Checked In" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">House distribution</h3>
                  <p className="text-sm text-gray-500">Share of registrations by house</p>
                </div>
                <Badge variant="outline" className="w-fit border-[#333] bg-black text-gray-300">
                  {totals.housesTracked} houses
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <ChartContainer config={{ registrations: { label: 'Registrations', color: '#D4AF37' } }} className="h-[320px] w-full">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={houseChartData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={4}>
                      {houseChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <div className="space-y-3 self-center">
                  {houseChartData.map((entry) => (
                    <div key={entry.name} className="rounded-xl border border-[#222] bg-black p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                          <span className="text-sm font-medium text-white">{entry.name}</span>
                        </div>
                        <span className="text-sm text-gray-400">{entry.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#333] bg-[#111] p-4 sm:p-5">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Detailed breakdown</h3>
                <p className="text-sm text-gray-500">Department, house, registrations and share of total</p>
              </div>
            </div>

            <div className="space-y-2">
              {rowSummary.map((row) => {
                const checkedIn = Number(row.checked_in_count ?? 0)
                const total = Number(row.total_registrations)
                const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0
                return (
                  <div key={`${row.house_name}-${row.department}`} className="flex flex-col gap-3 rounded-xl border border-[#222] bg-black p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.department}</p>
                      <p className="text-xs text-gray-500">{row.house_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-gray-300">
                        {total.toLocaleString()} <span className="text-gray-500">registered</span>
                      </span>
                      <span className="text-emerald-400 font-medium">
                        {checkedIn.toLocaleString()} <span className="text-emerald-600 font-normal">checked in</span>
                      </span>
                      <Badge
                        variant="outline"
                        className={`border-[#333] bg-black ${
                          checkInRate >= 75
                            ? 'text-emerald-400 border-emerald-800'
                            : checkInRate >= 40
                            ? 'text-yellow-400 border-yellow-800'
                            : 'text-gray-400'
                        }`}
                      >
                        {checkInRate}% check-in
                      </Badge>
                      <Badge variant="outline" className="border-[#333] bg-black text-gray-500">
                        {Number(row.percentage).toFixed(2)}% of total
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
