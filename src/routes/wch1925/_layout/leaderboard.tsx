import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { useData } from '@/lib/store'
import { fetchAdminLeaderboard, adjustAdminLeaderboardPoints, type AdminLeaderboardRow } from '@/lib/adminApi'
import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useEffect, useState } from 'react'
import { Plus, Minus, Save, Trophy, TrendingUp, TrendingDown, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/leaderboard')({
  component: LeaderboardManagement,
})

function LeaderboardManagement() {
  const { hasPermission, user } = useAuth()
  const { houses, updateHousePoints, pointsHistory, refreshData } = useData()
  const [leaderboardRows, setLeaderboardRows] = useState<AdminLeaderboardRow[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const [pointAdjustments, setPointAdjustments] = useState<Record<string, number>>({})
  const [pointReasons, setPointReasons] = useState<Record<string, string>>({})

  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true)
    try {
      const rows = await fetchAdminLeaderboard()
      setLeaderboardRows(rows)
    } catch {
      setLeaderboardRows([])
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  const canRead = hasPermission('leaderboard', 'read')

  useEffect(() => {
    if (!canRead) return
    void loadLeaderboard()
  }, [canRead])

  if (!canRead) {
    return <AccessDenied />
  }

  const canEdit = hasPermission('leaderboard', 'update')

  const handleAdjustPoints = (houseName: string, amount: number) => {
    setPointAdjustments(prev => ({
      ...prev,
      [houseName]: (prev[houseName] || 0) + amount
    }))
  }

  const handleSavePoints = async (houseName: string) => {
    const adjustment = pointAdjustments[houseName] || 0
    const reason = pointReasons[houseName] || ''

    if (adjustment === 0) return
    if (adjustment < 0 && !reason.trim()) {
      toast.error('A reason is required for negative points')
      return
    }

    const remoteHouse = leaderboardRows.find((row) => row.house_name.toLowerCase() === houseName.toLowerCase())
    if (!remoteHouse) {
      toast.error('Unable to determine house from leaderboard data')
      return
    }

    try {
      await adjustAdminLeaderboardPoints(remoteHouse.house_id, adjustment, reason)
      // Optimistically update local store so UI reflects change immediately
      try {
        updateHousePoints(remoteHouse.house_name, adjustment, reason, user?.name || 'Admin')
      } catch (e) {
        // ignore optimistic update failures
      }
      await refreshData()
      setPointAdjustments((prev) => ({ ...prev, [houseName]: 0 }))
      setPointReasons((prev) => ({ ...prev, [houseName]: '' }))
      toast.success(`Points updated for ${houseName}`)
      await loadLeaderboard()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update leaderboard')
    }
  }

  const sortedHouses = [...houses].sort((a, b) => {
    const aPoints = leaderboardRows.find((row) => row.house_name.toLowerCase() === a.name.toLowerCase())?.total_points ?? a.points2026
    const bPoints = leaderboardRows.find((row) => row.house_name.toLowerCase() === b.name.toLowerCase())?.total_points ?? b.points2026
    return bPoints - aPoints
  })

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Leaderboard Management"
        subtitle="Live scoring and house rankings for SIMMAM 2026"
      />
      {loadingLeaderboard && (
        <div className="rounded-lg border border-[#333] bg-[#111] p-3 text-sm text-gray-400">
          Syncing leaderboard data from the backend...
        </div>
      )}

      <div className="grid gap-6">
        {sortedHouses.map((house, index) => {
          const adjustment = pointAdjustments[house.name] || 0
          const currentPoints = leaderboardRows.find((row) => row.house_name.toLowerCase() === house.name.toLowerCase())?.total_points ?? house.points2026
          const finalPoints = currentPoints + adjustment
          
          return (
            <div 
              key={house.name}
              className="bg-[#111] border border-[#333] rounded-lg p-6 flex flex-col items-center gap-6"
            >
              <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold bg-black border border-[#333] text-white"
                  >
                    {index + 1}
                  </div>
                  {index === 0 && (
                    <Trophy className="absolute -top-3 -left-3 w-8 h-8 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{house.name}</h3>
                    <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{house.tagline}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="text-3xl font-black text-white tracking-tighter">
                      {finalPoints.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-2 font-medium uppercase tracking-widest">Points</span>
                    </div>
                    {adjustment !== 0 && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${adjustment > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                        {adjustment > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {adjustment > 0 ? '+' : ''}{adjustment}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {canEdit && (
                  <div className="flex flex-col w-full md:w-auto gap-2">
                    <div className="flex items-center gap-3 bg-black border border-[#333] p-3 rounded-lg">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-[#222] hover:text-white"
                        onClick={() => handleAdjustPoints(house.name, -100)}
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      
                      <div className="w-20">
                        <Input 
                          type="number" 
                          value={adjustment}
                          onChange={(e) => setPointAdjustments(prev => ({ ...prev, [house.name]: parseInt(e.target.value) || 0 }))}
                          className="text-center bg-transparent border-none focus-visible:ring-0 text-white font-medium text-lg"
                        />
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-md hover:bg-[#222] hover:text-white"
                        onClick={() => handleAdjustPoints(house.name, 100)}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>

                      <div className="w-px h-8 bg-[#333] mx-2" />

                      <Button 
                        className="bg-white text-black hover:bg-gray-200 rounded-md font-medium px-6"
                        disabled={adjustment === 0}
                        onClick={() => handleSavePoints(house.name)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>

                    {adjustment < 0 && (
                      <Input
                        placeholder="Required: Reason for deduction..."
                        className="bg-black border-[#333] focus:border-white text-white placeholder:text-gray-600"
                        value={pointReasons[house.name] || ''}
                        onChange={(e) => setPointReasons(prev => ({ ...prev, [house.name]: e.target.value }))}
                      />
                    )}
                  </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-12 bg-[#111] border border-[#333] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-white">Point Adjustment History</h3>
        </div>
        
        {pointsHistory.length === 0 ? (
          <p className="text-gray-500 text-sm">No manual adjustments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {pointsHistory.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black border border-[#333] rounded-lg gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{log.houseName}</span>
                    <span className={`text-sm font-bold ${log.points > 0 ? 'text-gray-400' : 'text-white underline decoration-gray-500/50'}`}>
                      {log.points > 0 ? '+' : ''}{log.points}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{log.reason}</p>
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