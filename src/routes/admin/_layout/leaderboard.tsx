import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { History, Minus, Plus, Save, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { toast } from 'sonner'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'

export const Route = createFileRoute('/admin/_layout/leaderboard')({
  component: LeaderboardManagement,
})

function LeaderboardManagement() {
  const { hasPermission, user } = useAuth()
  const { houses, updateHousePoints, pointsHistory } = useData()
  const [pointAdjustments, setPointAdjustments] = useState<Record<string, number>>({})
  const [pointReasons, setPointReasons] = useState<Record<string, string>>({})

  if (!hasPermission('leaderboard', 'read')) {
    return <AccessDenied />
  }

  const canEdit = hasPermission('leaderboard', 'update')

  const handleAdjustPoints = (houseName: string, amount: number) => {
    setPointAdjustments((previous) => ({
      ...previous,
      [houseName]: (previous[houseName] || 0) + amount,
    }))
  }

  const handleSavePoints = (houseName: string) => {
    const adjustment = pointAdjustments[houseName] || 0
    const reason = pointReasons[houseName] || ''

    if (adjustment === 0) return
    if (adjustment < 0 && !reason.trim()) {
      toast.error('A reason is required for negative points')
      return
    }

    updateHousePoints(houseName, adjustment, reason, user?.name)
    setPointAdjustments((previous) => ({ ...previous, [houseName]: 0 }))
    setPointReasons((previous) => ({ ...previous, [houseName]: '' }))
    toast.success(`Points updated for ${houseName}`)
  }

  const sortedHouses = [...houses].sort((left, right) => right.points2026 - left.points2026)

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Leaderboard Management" subtitle="Live scoring and house rankings for SIMMAM 2026" />

      <div className="grid gap-6">
        {sortedHouses.map((house, index) => {
          const adjustment = pointAdjustments[house.name] || 0
          const finalPoints = house.points2026 + adjustment

          return (
            <div key={house.name} className="flex flex-col items-center gap-6 rounded-lg border border-[#333] bg-[#111] p-6">
              <div className="flex w-full flex-col items-center gap-6 md:flex-row">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#333] bg-black text-2xl font-bold text-white">
                    {index + 1}
                  </div>
                  {index === 0 && <Trophy className="absolute -left-3 -top-3 h-8 w-8 text-white" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{house.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{house.tagline}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="text-3xl font-black tracking-tighter text-white">
                      {finalPoints.toLocaleString()}
                      <span className="ml-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Points</span>
                    </div>
                    {adjustment !== 0 && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${adjustment > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                        {adjustment > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {adjustment > 0 ? '+' : ''}{adjustment}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="flex w-full flex-col gap-2 md:w-auto">
                  <div className="flex items-center gap-3 rounded-lg border border-[#333] bg-black p-3">
                    <Button variant="ghost" size="icon" className="rounded-md hover:bg-[#222] hover:text-white" onClick={() => handleAdjustPoints(house.name, -100)}>
                      <Minus className="h-5 w-5" />
                    </Button>

                    <div className="w-20">
                      <Input
                        type="number"
                        value={adjustment}
                        onChange={(event) => setPointAdjustments((previous) => ({ ...previous, [house.name]: parseInt(event.target.value) || 0 }))}
                        className="border-none bg-transparent text-center text-lg font-medium text-white focus-visible:ring-0"
                      />
                    </div>

                    <Button variant="ghost" size="icon" className="rounded-md hover:bg-[#222] hover:text-white" onClick={() => handleAdjustPoints(house.name, 100)}>
                      <Plus className="h-5 w-5" />
                    </Button>

                    <div className="mx-2 h-8 w-px bg-[#333]" />

                    <Button className="rounded-md bg-white px-6 font-medium text-black hover:bg-gray-200" disabled={adjustment === 0} onClick={() => handleSavePoints(house.name)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>

                  {adjustment < 0 && (
                    <Input
                      placeholder="Required: Reason for deduction..."
                      className="border-[#333] bg-black text-white placeholder:text-gray-600 focus:border-white"
                      value={pointReasons[house.name] || ''}
                      onChange={(event) => setPointReasons((previous) => ({ ...previous, [house.name]: event.target.value }))}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-12 rounded-lg border border-[#333] bg-[#111] p-6">
        <div className="mb-6 flex items-center gap-3">
          <History className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-white">Point Adjustment History</h3>
        </div>

        {pointsHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No manual adjustments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {pointsHistory.map((log) => (
              <div key={log.id} className="flex flex-col gap-4 rounded-lg border border-[#333] bg-black p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{log.houseName}</span>
                    <span className={`text-sm font-bold ${log.points > 0 ? 'text-gray-400' : 'text-white underline decoration-red-500/50'}`}>
                      {log.points > 0 ? '+' : ''}{log.points}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{log.reason}</p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>By {log.issuedBy}</p>
                  <p>{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}