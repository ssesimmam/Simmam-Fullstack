export function resolveApiBase(raw: string | undefined, suffix: string): string {
  const trimmed = raw?.trim()
  if (!trimmed) return suffix

  const normalized = trimmed.replace(/\/$/, '')
  if (normalized.endsWith(suffix)) return normalized

  const basePrefix = suffix.startsWith('/api') ? '/api' : suffix
  if (normalized.endsWith(basePrefix) && suffix.startsWith(basePrefix)) {
    return `${normalized}${suffix.slice(basePrefix.length)}`
  }

  return `${normalized}${suffix}`
}

export async function readJsonPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}