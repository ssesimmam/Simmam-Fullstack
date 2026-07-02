import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, Cpu, Palette, Dumbbell, Sparkles, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { getHousePointsBreakdown, type HousePointsBreakdownDTO } from '@/api/events'

// ─── Types ──────────────────────────────────────────────────────────────────

interface HousePointsBreakdownProps {
  houseId: string
  houseName: string
  houseAccent: string
  isOpen: boolean
  onToggle: () => void
}

const CATEGORY_CONFIG = {
  tech: {
    label: 'Tech',
    icon: Cpu,
    color: '#60a5fa',
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
  },
  non_tech: {
    label: 'Non-Tech',
    icon: Sparkles,
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/30',
  },
  cultural: {
    label: 'Cultural',
    icon: Palette,
    color: '#a78bfa',
    gradient: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/30',
  },
  sports: {
    label: 'Sports',
    icon: Dumbbell,
    color: '#34d399',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
  },
} as const

type CategoryKey = keyof typeof CATEGORY_CONFIG

// ─── Category Stat Card ─────────────────────────────────────────────────────

function CategoryCard({
  category,
  points,
  index,
}: {
  category: CategoryKey
  points: number
  index: number
}) {
  const config = CATEGORY_CONFIG[category]
  const Icon = config.icon

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${config.border} bg-gradient-to-br ${config.gradient} p-4 transition-all duration-300 hover:scale-[1.02]`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="absolute -right-3 -top-3 opacity-10">
        <Icon className="h-16 w-16" style={{ color: config.color }} />
      </div>
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: config.color }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        <div className="font-display text-2xl font-black text-white tabular-nums">
          {points.toLocaleString()}
        </div>
        <div className="mt-1 text-[10px] text-white/30 uppercase tracking-wider">Points</div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-white/10 bg-[#0d0d0d]/95 px-4 py-3 shadow-xl backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-white/60">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.name}:</span>
          <span className="font-bold text-white">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function HousePointsBreakdown({
  houseId,
  houseName,
  houseAccent,
  isOpen,
  onToggle,
}: HousePointsBreakdownProps) {
  const [data, setData] = useState<HousePointsBreakdownDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!houseId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getHousePointsBreakdown(houseId)
      setData(result)
    } catch (err: any) {
      setError(err?.message || 'Failed to load breakdown')
    } finally {
      setLoading(false)
    }
  }, [houseId])

  // Lazy-load: only fetch when opened
  useEffect(() => {
    if (isOpen && !data && !loading) {
      void fetchData()
    }
  }, [isOpen, data, loading, fetchData])

  const categories = data?.categories
  const dailyHistory = data?.dailyHistory || []

  // Format dates for the chart
  const chartData = dailyHistory.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }))

  return (
    <div className="overflow-hidden">
      {/* Toggle Button Row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 transition-all hover:bg-white/5 hover:text-white/70"
      >
        <TrendingUp className="h-3 w-3" />
        <span>{isOpen ? 'Hide' : 'View'} Points Breakdown</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isOpen ? '800px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pt-4 pb-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
              <span className="ml-3 text-xs text-white/30">Loading breakdown...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-xs text-red-400">
              {error}
            </div>
          ) : categories ? (
            <>
              {/* Category Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key, i) => (
                  <CategoryCard
                    key={key}
                    category={key}
                    points={categories[key] || 0}
                    index={i}
                  />
                ))}
              </div>

              {/* Line Graph */}
              {chartData.length > 0 ? (
                <div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-4 md:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-white/30" />
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                      Points Over Time
                    </h4>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}
                        iconType="circle"
                        iconSize={6}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke={houseAccent || '#D4AF37'}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: houseAccent || '#D4AF37' }}
                      />
                      <Line type="monotone" dataKey="tech" name="Tech" stroke={CATEGORY_CONFIG.tech.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="non_tech" name="Non-Tech" stroke={CATEGORY_CONFIG.non_tech.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="cultural" name="Cultural" stroke={CATEGORY_CONFIG.cultural.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="sports" name="Sports" stroke={CATEGORY_CONFIG.sports.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-xs text-white/25">
                  No historical data yet. Points will appear here once admins start adding them.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
