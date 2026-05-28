export function getFrontendOrigin(): string {
  const configured = (import.meta.env.VITE_FRONTEND_URL as string | undefined)?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  // Keep production auth callbacks pinned to the canonical live frontend domain.
  if (import.meta.env.PROD) {
    return 'https://live.ssesimmam.com'
  }

  return window.location.origin
}

export function getAuthCallbackUrl(): string {
  return `${getFrontendOrigin()}/auth/callback`
}