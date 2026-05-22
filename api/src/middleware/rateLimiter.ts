import { Request, Response, NextFunction } from 'express'
import IORedis from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'

// In-memory store for development (replace with Redis for production)
const requestCounts: Record<string, { count: number; resetTime: number }> = {}
const MAX_MEMORY_RATE_LIMIT_KEYS = 10000
const IS_PROD = process.env.NODE_ENV === 'production'

// Redis client (optional). If REDIS_URL is set, use Redis for counters across instances.
const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || ''
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
let redis: any = null
let upstash: UpstashRedis | null = null
let redisAvailable = false
let upstashAvailable = false

if (redisUrl) {
  try {
    redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    })
    redis.connect()
    redis.on('ready', () => {
      redisAvailable = true
      console.log('[RateLimit] Redis connection established')
    })
    redis.on('error', (e: any) => {
      redisAvailable = false
      console.error('[RateLimit] Redis error:', e.message)
    })
    redis.on('close', () => {
      redisAvailable = false
      console.log('[RateLimit] Redis connection closed')
    })
  } catch (e) {
    console.error('[RateLimit] Failed to create Redis client', e)
    redis = null
  }
} else if (upstashUrl && upstashToken) {
  try {
    upstash = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken,
    })
    upstashAvailable = true
    console.log('[RateLimit] Upstash Redis configured')
  } catch (e) {
    console.error('[RateLimit] Failed to create Upstash client', e)
    upstash = null
  }
}

function normalizeIp(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/^::ffff:/, '')
}

function getClientIp(req: any): string {
  const expressIp = normalizeIp(req.ip)
  if (expressIp) return expressIp

  const cloudflareIp = normalizeIp(req.headers['cf-connecting-ip'] as string | undefined)
  if (cloudflareIp) return cloudflareIp

  const realIp = normalizeIp(req.headers['x-real-ip'] as string | undefined)
  if (realIp) return realIp

  const forwardedIp = normalizeIp((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0])
  if (forwardedIp) return forwardedIp

  return normalizeIp(req.socket?.remoteAddress) || 'unknown'
}

function getRouteKey(req: any): string {
  const routePath = req?.route?.path ? String(req.route.path) : req.path || 'unknown'
  return `${req.method || 'GET'}:${routePath}`
}

export function createSimpleLimiter(bucket: string, windowMs: number, max: number, message: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${bucket}:${getClientIp(req)}:${getRouteKey(req)}`
    const now = Date.now()

    // If Redis is available, use it for atomic increments with expiry so counts are shared across instances.
    if (redisAvailable && redis) {
      try {
        const r = redis.multi()
        r.incr(key)
        r.pttl(key)
        const execRes = await r.exec()
        const incrRes = execRes?.[0]
        const pttlRes = execRes?.[1]
        const count = Number(incrRes?.[1] ?? 0)
        let pttl = Number(pttlRes?.[1] ?? -1)
        if (pttl < 0) {
          // set TTL
          await redis.pexpire(key, windowMs)
          pttl = windowMs
        }
        if (count > max) {
          const retryAfterSeconds = Math.ceil(pttl / 1000)
          res.setHeader('Retry-After', String(retryAfterSeconds))
          res.setHeader('RateLimit-Remaining', '0')
          return res.status(429).json({ error: message })
        }
        res.setHeader('RateLimit-Remaining', String(Math.max(0, max - count)))
        return next()
      } catch (e) {
        console.error('[RateLimit] Redis error, falling back to memory:', (e as any).message)
        redisAvailable = false
        // fallthrough to in-memory
      }
    }

    if (upstashAvailable && upstash) {
      try {
        const count = Number(await upstash.incr(key))
        let ttlSeconds = Number(await upstash.ttl(key))
        if (ttlSeconds < 0) {
          ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000))
          await upstash.expire(key, ttlSeconds)
        }

        if (count > max) {
          res.setHeader('Retry-After', String(ttlSeconds))
          res.setHeader('RateLimit-Remaining', '0')
          return res.status(429).json({ error: message })
        }

        res.setHeader('RateLimit-Remaining', String(Math.max(0, max - count)))
        return next()
      } catch (e) {
        console.error('[RateLimit] Upstash error, falling back to memory:', (e as any).message)
        upstashAvailable = false
      }
    }

    // In-memory fallback (single-instance, bounded)
    if (!requestCounts[key]) {
      requestCounts[key] = { count: 0, resetTime: now + windowMs }
    }
    if (now > requestCounts[key].resetTime) {
      requestCounts[key] = { count: 0, resetTime: now + windowMs }
    }
    requestCounts[key].count += 1
    if (requestCounts[key].count > max) {
      const retryAfterSeconds = Math.ceil((requestCounts[key].resetTime - now) / 1000)
      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.setHeader('RateLimit-Remaining', '0')
      return res.status(429).json({ error: message })
    }
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - requestCounts[key].count)))
    next()
  }
}

// Public endpoints: 600 requests per 15 min per IP per route
export const publicLimiter = createSimpleLimiter(
  'public',
  15 * 60 * 1000,
  600,
  'Too many requests, please try again later'
)

// Auth/Write endpoints: 120 requests per 15 min per IP per route
export const authLimiter = createSimpleLimiter(
  'auth',
  15 * 60 * 1000,
  120,
  'Too many auth attempts, please try again later'
)

// Registration endpoint: 20 per hour per IP per route
export const registrationLimiter = createSimpleLimiter(
  'registration',
  60 * 60 * 1000,
  20,
  'Registration limit exceeded, try again in 1 hour'
)

// Admin endpoints: 1200 per 15 min per IP per route.
// Admin dashboard polls multiple resources periodically, so this needs a higher ceiling.
export const adminLimiter = createSimpleLimiter(
  'admin',
  15 * 60 * 1000,
  1200,
  'Admin request limit exceeded'
)

export function resetRateLimitCounts() {
  for (const k of Object.keys(requestCounts)) delete requestCounts[k]
}

// Cleanup expired rate limit entries every 5 minutes to prevent memory explosion
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  let expired = 0
  
  for (const key in requestCounts) {
    if (requestCounts[key].resetTime < now) {
      delete requestCounts[key]
      cleaned++
    } else {
      expired++
    }
  }
  
  const total = Object.keys(requestCounts).length
  if (total > MAX_MEMORY_RATE_LIMIT_KEYS) {
    console.warn(
      `[RateLimit] Memory usage high: ${total} keys (max: ${MAX_MEMORY_RATE_LIMIT_KEYS}), cleaned ${cleaned} expired entries`,
    )
  }
  
  if (cleaned > 0 && total % 100 === 0) {
    console.log(`[RateLimit] Cleanup: removed ${cleaned} expired entries, ${total} remaining`)
  }
}, 5 * 60 * 1000)

export function getRateLimiterHealth() {
  return {
    redis: {
      available: redisAvailable,
      configured: !!redisUrl,
    },
    upstash: {
      available: upstashAvailable,
      configured: !!upstashUrl && !!upstashToken,
    },
    memory: {
      keys: Object.keys(requestCounts).length,
      maxKeys: MAX_MEMORY_RATE_LIMIT_KEYS,
    },
  }
}

export async function closeRateLimiterClients() {
  try {
    if (redis && typeof redis.quit === 'function') {
      await redis.quit()
      console.log('[RateLimit] Redis client closed')
    }
  } catch (err) {
    console.error('[RateLimit] Error closing Redis client', (err as any).message)
  }
}
