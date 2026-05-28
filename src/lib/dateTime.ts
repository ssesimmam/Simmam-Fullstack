/**
 * Date/time formatting utilities for IST (Indian Standard Time, UTC+5:30).
 * These are purely client-side string helpers — no SSR concerns.
 */

const IST_OFFSET = 5.5 * 60 * 60 * 1000 // UTC+5:30 in milliseconds

function toIst(dateStr: string): Date {
  const d = new Date(dateStr)
  return new Date(d.getTime() + IST_OFFSET)
}

/**
 * Formats a date string to a readable IST date-time string.
 * Example: "28 May 2026, 10:30 AM"
 */
export function formatIstDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/**
 * Returns a day label such as "Day 1", "Day 2" based on IST date.
 * Falls back to the formatted date if not recognized.
 */
const DAY_LABELS: Record<string, string> = {
  '2026-06-10': 'Day 1',
  '2026-06-11': 'Day 2',
  '2026-06-12': 'Day 3',
  '2026-06-13': 'Day 4',
}

export function formatIstDayLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const key = new Date(dateStr).toISOString().split('T')[0]
    return DAY_LABELS[key] ?? formatIstDateTime(dateStr)
  } catch {
    return dateStr
  }
}
