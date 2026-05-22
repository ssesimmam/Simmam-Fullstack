import { Request, Response, NextFunction } from 'express'
import IORedis from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'

// In-memory cache store with bounded size (production prefers Redis)
interface CacheEntry {
  data: any
  expiry: number
  lastAccess: number
}

const cache: Record<string, CacheEntry> = {}
const MAX_MEMORY_CACHE_ENTRIES = 1000
const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || ''
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
const cachePrefix = process.env.REDIS_CACHE_PREFIX || 'cache:'
const IS_PROD = process.env.NODE_ENV === 'production'
const CACHE_PREFER_REDIS = process.env.CACHE_PREFER_REDIS === 'true'

let redis: IORedis | null = null
let upstash: UpstashRedis | null = null
let redisAvailable = false
let upstashAvailable = false

if (redisUrl) {
  try {
    redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    })
    redis.connect()
    redis.on('ready', () => {
      redisAvailable = true
      console.log('[Cache] Redis connection established')
    })
    redis.on('error', (err) => {
      redisAvailable = false
      console.error('[Cache] Redis error:', err.message)
    })
    redis.on('close', () => {
      redisAvailable = false
      console.log('[Cache] Redis connection closed')
    })
  } catch (err) {
    console.error('[Cache] Failed to initialize Redis, using memory fallback', err)
    redis = null
  }
} else if (upstashUrl && upstashToken) {
  try {
    upstash = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken,
    })
    upstashAvailable = true
    console.log('[Cache] Upstash Redis configured')
  } catch (err) {
    console.error('[Cache] Failed to initialize Upstash, using memory fallback', err)
    upstash = null
  }
}

const stableStringify = (input: unknown): string => {
  if (input === null || typeof input !== 'object') return JSON.stringify(input)
  if (Array.isArray(input)) return `[${input.map(stableStringify).join(',')}]`

  const entries = Object.entries(input as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `"${key}":${stableStringify(value)}`)

  return `{${entries.join(',')}}`
}

export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const cacheKey = `${cachePrefix}${req.path}:${stableStringify(req.query || {})}`
    const now = Date.now()

    // Try Redis first (if available)
    if (redisAvailable && redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          res.setHeader('X-Cache', 'HIT-REDIS')
          return res.json(JSON.parse(cached))
        }
      } catch (err) {
        console.error('[Cache] Redis read error:', (err as any).message)
        redisAvailable = false
      }
    }

    // Try Upstash
    if (upstashAvailable && upstash) {
      try {
        const cached = await upstash.get<string>(cacheKey)
        if (cached) {
          res.setHeader('X-Cache', 'HIT-UPSTASH')
          return res.json(JSON.parse(cached))
        }
      } catch (err) {
        console.error('[Cache] Upstash read error:', (err as any).message)
        upstashAvailable = false
      }
    }

    // Check memory cache (bounded fallback). If CACHE_PREFER_REDIS is true and
    // neither Redis nor Upstash are available, skip using the memory fallback
    // to avoid unbounded growth and surface a MISS instead.
    const shouldUseMemoryFallback = !(CACHE_PREFER_REDIS && !redisAvailable && !upstashAvailable)
    if (shouldUseMemoryFallback) {
      if (cache[cacheKey] && cache[cacheKey].expiry > now) {
        res.setHeader('X-Cache', 'HIT-MEMORY')
        return res.json(cache[cacheKey].data)
      }
    } else {
      console.warn('[Cache] CACHE_PREFER_REDIS=true and no remote cache available — skipping memory fallback')
    }

    // Store original res.json
    const originalJson = res.json.bind(res)

    // Override res.json to cache the response
    res.json = function (data: any) {
      const dataStr = JSON.stringify(data)

      // Store in memory (bounded) unless production is configured to prefer Redis
      // and no remote cache is available. This prevents unbounded memory growth
      // when Redis/Upstash are down and the system is configured to prefer them.
      if (shouldUseMemoryFallback) {
        if (Object.keys(cache).length >= MAX_MEMORY_CACHE_ENTRIES) {
          const oldestKey = Object.entries(cache).reduce((oldest, [key, entry]) =>
            entry.lastAccess < oldest.entry.lastAccess ? { key, entry } : oldest,
            { key: Object.keys(cache)[0], entry: cache[Object.keys(cache)[0]] },
          ).key
          delete cache[oldestKey]
          console.warn('[Cache] Memory cache full — evicting oldest entry', oldestKey)
        }

        cache[cacheKey] = {
          data,
          expiry: now + ttlSeconds * 1000,
          lastAccess: now,
        }
      } else {
        // Intentionally skip memory caching
      }

      // Async write to Redis (don't block response)
      if (redisAvailable && redis) {
        redis
          .set(cacheKey, dataStr, 'EX', ttlSeconds)
          .catch((err) => {
            console.error('[Cache] Redis write failed:', (err as any).message)
            redisAvailable = false
          })
      }

      // Async write to Upstash (don't block response)
      if (upstashAvailable && upstash) {
        upstash
          .set(cacheKey, dataStr, { ex: ttlSeconds })
          .catch((err) => {
            console.error('[Cache] Upstash write failed:', (err as any).message)
            upstashAvailable = false
          })
      }

      res.setHeader('X-Cache', 'MISS')
      return originalJson(data)
    }

    next()
  }
}

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  for (const key in cache) {
    if (cache[key].expiry < now) {
      delete cache[key]
      cleaned++
    }
  }
  if (cleaned > 0) {
    console.log(`[Cache] Cleanup: removed ${cleaned} expired entries (${Object.keys(cache).length} remaining)`)
  }
}, 10 * 60 * 1000)

// Expose health info for readiness checks
export function getCacheHealth() {
  return {
    redis: {
      available: redisAvailable,
      url: redisUrl ? true : false,
    },
    upstash: {
      available: upstashAvailable,
      configured: upstashUrl && upstashToken ? true : false,
    },
    memory: {
      entries: Object.keys(cache).length,
      maxEntries: MAX_MEMORY_CACHE_ENTRIES,
    },
  }
}

export async function closeCacheClients() {
  try {
    if (redis) {
      await redis.quit()
      console.log('[Cache] Redis client closed')
    }
  } catch (err) {
    console.error('[Cache] Error closing Redis client', (err as any).message)
  }
}
