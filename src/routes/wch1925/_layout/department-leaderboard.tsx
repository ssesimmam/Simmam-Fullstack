import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
    const departmentMap = new Map<string, number>()
    const houseMap = new Map<string, number>()

    for (const row of rows) {
      departmentMap.set(row.department, (departmentMap.get(row.department) || 0) + Number(row.total_registrations))
      houseMap.set(row.house_name, (houseMap.get(row.house_name) || 0) + Number(row.total_registrations))
    }

    const totalRegistrations = [...rows].reduce((sum, row) => sum + Number(row.total_registrations), 0)

    return {
      totalRegistrations,
      departmentsTracked: departmentMap.size,
      housesTracked: houseMap.size,
      departmentTotals: departmentMap,
      houseTotals: houseMap,
    }
  }, [rows])

  const departmentChartData = useMemo(() => {
    return [...totals.departmentTotals.entries()]
      .map(([department, total]) => ({ department, registrations: total }))
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Total registrations</p>
              <p className="mt-2 text-3xl font-bold text-white">{totals.totalRegistrations.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Departments tracked</p>
              <p className="mt-2 text-3xl font-bold text-white">{totals.departmentsTracked}</p>
            </div>
            <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Houses represented</p>
              <p className="mt-2 text-3xl font-bold text-white">{totals.housesTracked}</p>
            </div>
            <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Top department share</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {departmentChartData[0] ? `${Math.round((departmentChartData[0].registrations / totals.totalRegistrations) * 100)}%` : '0%'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Top departments</h3>
                  <p className="text-sm text-gray-500">Aggregated registrations across all houses</p>
                </div>
                <Badge variant="outline" className="border-[#333] bg-black text-gray-300">
                  Top 8
                </Badge>
              </div>

              <ChartContainer
                config={{ registrations: { label: 'Registrations', color: '#D4AF37' } }}
                className="h-[320px] w-full"
              >
                <BarChart data={departmentChartData} margin={{ left: 4, right: 4, top: 16 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#2b2b2b" />
                  <XAxis dataKey="department" tickLine={false} axisLine={false} stroke="#8b8b8b" />
                  <YAxis tickLine={false} axisLine={false} stroke="#8b8b8b" />
                  <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                  <Bar dataKey="registrations" fill="var(--color-registrations)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">House distribution</h3>
                  <p className="text-sm text-gray-500">Share of registrations by house</p>
                </div>
                <Badge variant="outline" className="border-[#333] bg-black text-gray-300">
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

          <div className="rounded-2xl border border-[#333] bg-[#111] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Detailed breakdown</h3>
                <p className="text-sm text-gray-500">Department, house, registrations and share of total</p>
              </div>
            </div>

            <div className="space-y-2">
              {rowSummary.map((row) => (
                <div key={`${row.house_name}-${row.department}`} className="flex flex-col gap-3 rounded-xl border border-[#222] bg-black p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{row.department}</p>
                    <p className="text-xs text-gray-500">{row.house_name}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-300">
                    <span>{Number(row.total_registrations).toLocaleString()} registrations</span>
                    <Badge variant="outline" className="border-[#333] bg-black text-gray-300">
                      {Number(row.percentage).toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      </div>
    </div>
  )
}
