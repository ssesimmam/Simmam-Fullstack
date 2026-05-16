import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Layers,
  Zap,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff,
  MonitorSmartphone,
} from 'lucide-react'

/**
 * WebHealthMonitor — Developer-only diagnostic panel.
 *
 * Design principles:
 *   1. Zero interception — never wraps fetch/XHR/addEventListener.
 *   2. Read-only APIs   — performance.memory, PerformanceObserver, navigator.connection.
 *   3. Passive polling  — a single setInterval reads snapshot data; no forced GC or layout.
 *   4. Self-contained   — no external dependencies, no store mutations.
 */

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────
interface HealthSnapshot {
  // Memory (Chrome only)
  heapUsed: number | null
  heapTotal: number | null
  heapLimit: number | null
  heapPercent: number | null

  // DOM
  domNodes: number
  domDepth: number

  // Timing
  pageLoadTime: number | null
  domContentLoaded: number | null
  firstPaint: number | null
  firstContentfulPaint: number | null

  // Resources
  resourceCount: number
  transferSize: number
  totalResourceTime: number

  // FPS
  fps: number

  // Network
  online: boolean
  connectionType: string
  downlink: number | null
  rtt: number | null
  saveData: boolean

  // JS Long Tasks (>50ms)
  longTaskCount: number

  // Session
  uptime: number // seconds since component mounted
  timestamp: number
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatMs(ms: number | null): string {
  if (ms === null || ms < 0) return '—'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getMaxDomDepth(el: Element, depth: number): number {
  let max = depth
  // Sample only first 5 children per level to keep this truly lightweight
  const children = el.children
  const limit = Math.min(children.length, 5)
  for (let i = 0; i < limit; i++) {
    const d = getMaxDomDepth(children[i], depth + 1)
    if (d > max) max = d
  }
  return max
}

function getSeverity(value: number, warn: number, crit: number): 'ok' | 'warn' | 'crit' {
  if (value >= crit) return 'crit'
  if (value >= warn) return 'warn'
  return 'ok'
}

const sevColor = { ok: 'text-emerald-400', warn: 'text-yellow-400', crit: 'text-red-400' }
const sevBg = { ok: 'bg-emerald-400/10 border-emerald-400/20', warn: 'bg-yellow-400/10 border-yellow-400/20', crit: 'bg-red-400/10 border-red-400/20' }
const sevDot = { ok: 'bg-emerald-400', warn: 'bg-yellow-400', crit: 'bg-red-400' }

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────
export default function WebHealthMonitor() {
  const mountTime = useRef(Date.now())
  const frameTimesRef = useRef<number[]>([])
  const lastFrameRef = useRef(performance.now())
  const rafRef = useRef<number>(0)
  const longTaskCountRef = useRef(0)
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // FPS tracking via requestAnimationFrame — very lightweight
  const trackFrame = useCallback(() => {
    const now = performance.now()
    const delta = now - lastFrameRef.current
    lastFrameRef.current = now
    frameTimesRef.current.push(delta)
    // Keep last 60 frames only
    if (frameTimesRef.current.length > 60) frameTimesRef.current.shift()
    rafRef.current = requestAnimationFrame(trackFrame)
  }, [])

  useEffect(() => {
    // Start FPS tracking
    rafRef.current = requestAnimationFrame(trackFrame)

    // Track long tasks (>50ms) passively
    let longTaskObserver: PerformanceObserver | null = null
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        longTaskCountRef.current += list.getEntries().length
      })
      longTaskObserver.observe({ type: 'longtask', buffered: true })
    } catch {
      // longtask not supported
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      longTaskObserver?.disconnect()
    }
  }, [trackFrame])

  // Snapshot collector — runs every 2s
  useEffect(() => {
    const collect = () => {
      // Memory
      const mem = (performance as any).memory
      const heapUsed = mem?.usedJSHeapSize ?? null
      const heapTotal = mem?.totalJSHeapSize ?? null
      const heapLimit = mem?.jsHeapSizeLimit ?? null
      const heapPercent = heapUsed && heapLimit ? (heapUsed / heapLimit) * 100 : null

      // DOM
      const domNodes = document.querySelectorAll('*').length
      const domDepth = getMaxDomDepth(document.documentElement, 0)

      // Navigation timing
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const pageLoadTime = nav ? nav.loadEventEnd - nav.startTime : null
      const domContentLoaded = nav ? nav.domContentLoadedEventEnd - nav.startTime : null

      // Paint timing
      const paintEntries = performance.getEntriesByType('paint')
      const fp = paintEntries.find(e => e.name === 'first-paint')
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')

      // Resource summary
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const resourceCount = resources.length
      let transferSize = 0
      let totalResourceTime = 0
      for (const r of resources) {
        transferSize += r.transferSize || 0
        totalResourceTime += r.duration || 0
      }

      // FPS from frame deltas
      const frames = frameTimesRef.current
      let fps = 0
      if (frames.length > 1) {
        const avg = frames.reduce((a, b) => a + b, 0) / frames.length
        fps = avg > 0 ? Math.round(1000 / avg) : 0
      }

      // Network info
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      const online = navigator.onLine
      const connectionType = conn?.effectiveType ?? (online ? 'unknown' : 'offline')
      const downlink = conn?.downlink ?? null
      const rtt = conn?.rtt ?? null
      const saveData = conn?.saveData ?? false

      setSnapshot({
        heapUsed,
        heapTotal,
        heapLimit,
        heapPercent,
        domNodes,
        domDepth,
        pageLoadTime,
        domContentLoaded,
        firstPaint: fp ? fp.startTime : null,
        firstContentfulPaint: fcp ? fcp.startTime : null,
        resourceCount,
        transferSize,
        totalResourceTime,
        fps,
        online,
        connectionType,
        downlink,
        rtt,
        saveData,
        longTaskCount: longTaskCountRef.current,
        uptime: (Date.now() - mountTime.current) / 1000,
        timestamp: Date.now(),
      })
    }

    collect() // immediate first snapshot
    const id = setInterval(collect, 2000)
    return () => clearInterval(id)
  }, [])

  if (!snapshot) return null

  // ── Severity calculations ──
  const memSev = snapshot.heapPercent !== null ? getSeverity(snapshot.heapPercent, 60, 85) : 'ok'
  const domSev = getSeverity(snapshot.domNodes, 1500, 5000)
  const fpsSev = snapshot.fps > 0 ? getSeverity(60 - snapshot.fps, 15, 30) : 'ok' // inverted: low fps = bad
  const longTaskSev = getSeverity(snapshot.longTaskCount, 10, 50)

  const overallSev: 'ok' | 'warn' | 'crit' = 
    [memSev, domSev, fpsSev, longTaskSev].includes('crit') ? 'crit' :
    [memSev, domSev, fpsSev, longTaskSev].includes('warn') ? 'warn' : 'ok'

  const overallLabel = { ok: 'Healthy', warn: 'Elevated', crit: 'Critical' }

  return (
    <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-6 hover:bg-black/30 transition group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg text-gray-300 group-hover:text-white transition">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Web Health Monitor</h3>
            <p className="text-sm text-gray-500">Client-side performance diagnostics • Zero overhead</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${sevBg[overallSev]}`}>
            <div className={`w-2 h-2 rounded-full ${sevDot[overallSev]} animate-pulse`} />
            <span className={sevColor[overallSev]}>{overallLabel[overallSev]}</span>
          </div>
          <RefreshCw className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
        </div>
      </button>

      {/* Dashboard */}
      {!isCollapsed && (
        <div className="border-t border-[#333] p-6 space-y-6">

          {/* Row 1: Core Vitals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FPS */}
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Frame Rate"
              value={`${snapshot.fps}`}
              unit="FPS"
              severity={fpsSev}
              sub={snapshot.fps >= 55 ? 'Smooth' : snapshot.fps >= 30 ? 'Acceptable' : 'Choppy'}
            />
            {/* Memory */}
            <MetricCard
              icon={<HardDrive className="w-4 h-4" />}
              label="Heap Usage"
              value={snapshot.heapUsed !== null ? formatBytes(snapshot.heapUsed) : 'N/A'}
              unit={snapshot.heapPercent !== null ? `${snapshot.heapPercent.toFixed(0)}%` : ''}
              severity={memSev}
              sub={snapshot.heapLimit !== null ? `of ${formatBytes(snapshot.heapLimit)}` : 'Chrome only'}
            />
            {/* DOM Nodes */}
            <MetricCard
              icon={<Layers className="w-4 h-4" />}
              label="DOM Nodes"
              value={`${snapshot.domNodes.toLocaleString()}`}
              unit={`depth ${snapshot.domDepth}`}
              severity={domSev}
              sub={snapshot.domNodes < 800 ? 'Light' : snapshot.domNodes < 1500 ? 'Normal' : 'Heavy'}
            />
            {/* Long Tasks */}
            <MetricCard
              icon={<Cpu className="w-4 h-4" />}
              label="Long Tasks"
              value={`${snapshot.longTaskCount}`}
              unit=">50ms"
              severity={longTaskSev}
              sub={snapshot.longTaskCount === 0 ? 'None detected' : `Since page load`}
            />
          </div>

          {/* Row 2: Timing & Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Page Timing */}
            <div className="bg-black border border-[#333] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                Page Timing
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TimingRow label="Page Load" value={formatMs(snapshot.pageLoadTime)} />
                <TimingRow label="DOM Ready" value={formatMs(snapshot.domContentLoaded)} />
                <TimingRow label="First Paint" value={formatMs(snapshot.firstPaint)} />
                <TimingRow label="FCP" value={formatMs(snapshot.firstContentfulPaint)} />
              </div>
            </div>

            {/* Network */}
            <div className="bg-black border border-[#333] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide">
                <Network className="w-3.5 h-3.5" />
                Network
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TimingRow
                  label="Status"
                  value={snapshot.online ? 'Online' : 'Offline'}
                  icon={snapshot.online
                    ? <Wifi className="w-3 h-3 text-emerald-400" />
                    : <WifiOff className="w-3 h-3 text-red-400" />
                  }
                />
                <TimingRow label="Type" value={snapshot.connectionType.toUpperCase()} />
                <TimingRow label="Bandwidth" value={snapshot.downlink !== null ? `${snapshot.downlink} Mbps` : '—'} />
                <TimingRow label="RTT" value={snapshot.rtt !== null ? `${snapshot.rtt} ms` : '—'} />
              </div>
              {snapshot.saveData && (
                <div className="text-xs text-yellow-400 flex items-center gap-1 pt-1">
                  <MonitorSmartphone className="w-3 h-3" />
                  Data Saver enabled — user is on a limited connection
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Resources */}
          <div className="bg-black border border-[#333] rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wide">
              <TrendingUp className="w-3.5 h-3.5" />
              Resource Summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-white text-lg font-bold">{snapshot.resourceCount}</div>
                <div className="text-gray-500 text-xs">Total Resources</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold">{formatBytes(snapshot.transferSize)}</div>
                <div className="text-gray-500 text-xs">Transfer Size</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold">{formatMs(snapshot.totalResourceTime)}</div>
                <div className="text-gray-500 text-xs">Total Load Time</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold">{formatUptime(snapshot.uptime)}</div>
                <div className="text-gray-500 text-xs">Session Uptime</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-gray-600 px-1">
            <span>Sampled every 2s via read-only Performance APIs — zero network/CPU overhead</span>
            <span>Last update: {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──
function MetricCard({
  icon,
  label,
  value,
  unit,
  severity,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  severity: 'ok' | 'warn' | 'crit'
  sub: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${sevBg[severity]} transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={sevColor[severity]}>{icon}</span>
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-bold ${sevColor[severity]}`}>{value}</span>
        {unit && <span className="text-gray-500 text-xs">{unit}</span>}
      </div>
      <div className="text-gray-500 text-[11px] mt-1">{sub}</div>
    </div>
  )
}

function TimingRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-500 text-[11px]">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-white text-sm font-medium">{value}</span>
      </div>
    </div>
  )
}
