import * as Sentry from '@sentry/node'

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    sendDefaultPii: true,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  })
}

