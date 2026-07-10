import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Award, Download, Search, CheckCircle2, XCircle } from 'lucide-react'

import AccessDenied from '@/components/admin/shared/AccessDenied'
import PageHeader from '@/components/admin/shared/PageHeader'
import { useAuth } from '@/lib/auth'
import { fetchAdminRegistrations, type AdminRegistrationRow } from '@/lib/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export const Route = createFileRoute('/wch1925/_layout/certificates')({
  component: CertificatePage,
})

// ─── Certificate canvas config ────────────────────────────────────────────────
// All positions are expressed as percentages of the certificate image dimensions.
// Certificate template: 3176 × 2240 px (landscape)
//
// The certificate has two gold horizontal lines:
//   Line 1 — at ~54% from top  (participant name sits just above line 2)
//   Line 2 — at ~64% from top  (event name sits just below, before the body text)
//
// Adjust CERT_CONFIG to reposition text without touching the rendering logic.
// ─── Certificate image dimensions: 3176 × 2240 px ───────────────────────────
//
// Layout of the template (measured visually from the PNG):
//
//   ┌─────────────────────────────────────┐  Y=0
//   │  Header (logos, title, subtitle)    │
//   │  "Certificate of Participation"     │
//   │  "This is to certify that"          │
//   │                                     │
//   │  ══════ GOLD LINE 1 (Y≈47%) ══════  │  ← ~1054 px
//   │                                     │
//   │      [PARTICIPANT NAME HERE]        │  ← Y≈52% (~1165 px)
//   │                                     │
//   │  ══════ GOLD LINE 2 (Y≈57%) ══════  │  ← ~1277 px
//   │                                     │
//   │      [EVENT NAME HERE]              │  ← Y≈63% (~1412 px)
//   │                                     │
//   │  "during the SIMMAM 2026 ..."       │
//   │  Footer logos, signature            │
//   └─────────────────────────────────────┘  Y=2240
//
// To reposition text: adjust xPct / yPct (values 0–1).
// To resize text:     adjust fontSizePx.

const CERT_CONFIG = {
  /** Path relative to the web root (public folder) */
  templatePath: '/Simmam-Certificate.png',

  /**
   * PARTICIPANT NAME
   * Slot: between gold line 1 (~Y=1054px) and gold line 2 (~Y=1277px)
   * Center of slot: ~Y=1165 px  →  1165/2240 ≈ 0.520
   */
  name: {
    xPct: 0.500,   // horizontal center
    yPct: 0.520,   // vertical center of the name slot
    fontSizePx: 84,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#1a1a1a',
    fontWeight: 'bold',
    maxWidthPct: 0.75, // maximum width as fraction of canvas width before auto-shrink
  },

  /**
   * EVENT NAME
   * Slot: between gold line 2 (~Y=1277px) and "during the..." text (~Y=1540px)
   * Center of slot: ~Y=1410 px  →  1410/2240 ≈ 0.630
   */
  event: {
    xPct: 0.500,   // horizontal center
    yPct: 0.630,   // vertical center of the event slot
    fontSizePx: 70,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#1a1a1a',
    fontWeight: 'bold',
    maxWidthPct: 0.70, // maximum width as fraction of canvas width before auto-shrink
  },
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Row = AdminRegistrationRow & { checked_in?: boolean }

// ─── Certificate drawing utility ───────────────────────────────────────────────

function drawCertificate(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  participantName: string,
  eventName: string,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = image.naturalWidth
  const H = image.naturalHeight
  canvas.width = W
  canvas.height = H

  // Draw template
  ctx.drawImage(image, 0, 0, W, H)

  // ── Participant name ──────────────────────────────────────────────────────
  const nameCfg = CERT_CONFIG.name
  ctx.save()
  ctx.font = `${nameCfg.fontWeight} ${nameCfg.fontSizePx}px ${nameCfg.fontFamily}`
  ctx.fillStyle = nameCfg.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Auto-shrink font if text overflows
  let fontSize = nameCfg.fontSizePx
  while (ctx.measureText(participantName).width > W * nameCfg.maxWidthPct && fontSize > 30) {
    fontSize -= 4
    ctx.font = `${nameCfg.fontWeight} ${fontSize}px ${nameCfg.fontFamily}`
  }
  ctx.fillText(participantName, W * nameCfg.xPct, H * nameCfg.yPct)
  ctx.restore()

  // ── Event name ────────────────────────────────────────────────────────────
  const eventCfg = CERT_CONFIG.event
  ctx.save()
  ctx.font = `${eventCfg.fontWeight} ${eventCfg.fontSizePx}px ${eventCfg.fontFamily}`
  ctx.fillStyle = eventCfg.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  let eventFontSize = eventCfg.fontSizePx
  while (ctx.measureText(eventName).width > W * eventCfg.maxWidthPct && eventFontSize > 24) {
    eventFontSize -= 4
    ctx.font = `${eventCfg.fontWeight} ${eventFontSize}px ${eventCfg.fontFamily}`
  }
  ctx.fillText(eventName, W * eventCfg.xPct, H * eventCfg.yPct)
  ctx.restore()
}

// ─── Component ─────────────────────────────────────────────────────────────────

function CertificatePage() {
  const { hasPermission } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [previewRow, setPreviewRow] = useState<Row | null>(null)
  const [certImage, setCertImage] = useState<HTMLImageElement | null>(null)
  const [generating, setGenerating] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Preload certificate template image once
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setCertImage(img)
    img.onerror = () => toast.error('Failed to load certificate template')
    img.src = CERT_CONFIG.templatePath
  }, [])

  // Draw preview whenever previewRow or template image changes
  useEffect(() => {
    if (!previewRow || !certImage || !previewCanvasRef.current) return
    drawCertificate(
      previewCanvasRef.current,
      certImage,
      previewRow.participant_name,
      previewRow.event_name,
    )
  }, [previewRow, certImage])

  const canRead = hasPermission('checkin', 'read') || hasPermission('registrations', 'read')

  const eventSuggestions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.event_name).filter(Boolean)))
  }, [rows])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminRegistrations({
        search: searchQuery || undefined,
        event: eventFilter || undefined,
      })
      setRows(data as Row[])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canRead) return
    void loadData()
  }, [canRead])

  const handleDownload = async (row: Row) => {
    if (!certImage) {
      toast.error('Certificate template not loaded yet')
      return
    }
    if (!row.checked_in) {
      toast.error('Participant must be checked in to generate a certificate')
      return
    }

    setGenerating(true)
    try {
      // Use the hidden canvas for download (full resolution)
      const canvas = canvasRef.current!
      drawCertificate(canvas, certImage, row.participant_name, row.event_name)
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Failed to create image blob')
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${row.participant_name.trim().replace(/\s+/g, '_')}_Certificate.png`
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      
      toast.success(`Certificate downloaded for ${row.participant_name}`)
    } catch (err) {
      toast.error('Failed to generate certificate')
    } finally {
      setGenerating(false)
    }
  }

  if (!canRead) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificate Generator"
        subtitle="Generate and download participation certificates. Only checked-in participants are eligible."
      />

      {/* Search bar */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Search by participant name, email or reg no..."
            className="pl-10 bg-black border-[#333] text-white"
          />
        </div>
        <Input
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadData()}
          list="cert-events"
          placeholder="Filter by event..."
          className="bg-black border-[#333] text-white sm:w-56"
        />
        <datalist id="cert-events">
          {eventSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Button className="bg-white text-black hover:bg-gray-200 shrink-0" onClick={loadData}>
          <Search className="w-4 h-4 mr-2" /> Search
        </Button>
      </div>

      {/* Participant list */}
      <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium">Participants</span>
          </div>
          <span className="text-xs text-gray-500">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="divide-y divide-[#222]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-44 bg-white/10 rounded" />
                  <div className="h-3 w-28 bg-white/6 rounded" />
                </div>
                <div className="h-9 w-40 bg-white/8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500 text-sm">
            No participants found. Try searching above.
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {rows.map((row) => (
              <div
                key={row.registration_id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 gap-3 transition ${previewRow?.registration_id === row.registration_id
                    ? 'bg-[#D4AF37]/5 border-l-2 border-[#D4AF37]'
                    : 'hover:bg-black/30'
                  }`}
              >
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{row.participant_name}</p>
                    {row.checked_in ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-900/30 border border-green-700/40 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        <CheckCircle2 className="w-3 h-3" /> Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-900/20 border border-red-700/30 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        <XCircle className="w-3 h-3" /> Not Checked In
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{row.event_name}</p>
                  <p className="text-gray-600 text-[11px] mt-1 font-mono">{row.reg_no || '-'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#333] text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    onClick={() =>
                      setPreviewRow(
                        previewRow?.registration_id === row.registration_id ? null : row,
                      )
                    }
                  >
                    {previewRow?.registration_id === row.registration_id ? 'Hide Preview' : 'Preview'}
                  </Button>

                  <Button
                    size="sm"
                    disabled={!row.checked_in || !certImage || generating}
                    title={
                      !row.checked_in
                        ? 'Participant must be checked in first'
                        : 'Download certificate'
                    }
                    className="bg-[#D4AF37] text-black hover:bg-[#e0bd55] disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => handleDownload(row)}
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Generate &amp; Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Preview */}
      {previewRow && certImage && (
        <div className="bg-[#111] border border-[#333] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">Certificate Preview</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {previewRow.participant_name} — {previewRow.event_name}
              </p>
            </div>
            {previewRow.checked_in && (
              <Button
                className="bg-[#D4AF37] text-black hover:bg-[#e0bd55]"
                onClick={() => handleDownload(previewRow)}
                disabled={generating}
              >
                <Download className="w-4 h-4 mr-2" />
                {generating ? 'Generating…' : 'Download Certificate'}
              </Button>
            )}
          </div>

          <div className="w-full overflow-hidden rounded-lg border border-[#333]">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-auto block"
            />
          </div>

          {!previewRow.checked_in && (
            <p className="text-amber-400 text-xs flex items-center gap-1.5">
              <XCircle className="w-4 h-4 shrink-0" />
              This participant is not checked in. Check them in first to enable the download button.
            </p>
          )}
        </div>
      )}

      {/* Hidden full-resolution canvas used for the download PNG */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  )
}
