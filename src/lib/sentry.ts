const getSentry = async () => {
  if (typeof window === 'undefined') {
    return null
  }

  return import('@sentry/react')
}

export const initSentry = async () => {
  const Sentry = await getSentry()
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!Sentry || !dsn) {
    return
  }

  const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1)

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    sendDefaultPii: true,
  })
}

export const captureSentryException = async (error: unknown) => {
  const Sentry = await getSentry()
  if (!Sentry) {
    return
  }

  Sentry.captureException(error)
}