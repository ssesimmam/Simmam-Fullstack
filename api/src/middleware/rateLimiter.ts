import { Request, Response, NextFunction } from "express";
import { monitorEventLoopDelay } from "perf_hooks";
import os from "os";
import IORedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

// ========================================
// MEMORY FALLBACK (DEV ONLY)
// ========================================
const requestCounts: Record<
  string,
  { count: number; resetTime: number }
> = {};

// ========================================
// DYNAMIC LOAD MONITOR
// Sheds traffic when the server reaches ~85% capacity.
//
// Three signals are checked (any one triggers shedding):
//   1. Event-loop lag  — proxy for CPU saturation
//   2. Memory pressure — heap approaching system limits
//   3. RPS backstop    — hard ceiling from k6 benchmarks
//
// k6 baseline (rate-limit OFF, 4000 VU):
//   Peak throughput ≈ 2 141 req/s
//   85 % of 2 141  ≈ 1 820 req/s → rounded to 1 800
// ========================================

// --- Event-loop lag ---
const EL_LAG_THRESHOLD_MS = 100; // >100 ms p99 lag → overloaded
let eventLoopP99 = 0;

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

// Sample the histogram every 2 seconds and reset
setInterval(() => {
  eventLoopP99 = histogram.percentile(99) / 1e6; // ns → ms
  histogram.reset();
}, 2_000);

// --- Memory pressure ---
const MEM_THRESHOLD = 0.85; // 85 % of total system memory

function isMemoryOverloaded(): boolean {
  return os.freemem() / os.totalmem() < 1 - MEM_THRESHOLD;
}

// --- RPS backstop ---
const GLOBAL_WINDOW_MS = 1_000;
const GLOBAL_MAX_RPS = 1_800; // 85 % of measured peak

let globalRequestCount = 0;
let globalWindowStart = Date.now();

function isRpsOverloaded(): boolean {
  const now = Date.now();
  if (now - globalWindowStart >= GLOBAL_WINDOW_MS) {
    globalWindowStart = now;
    globalRequestCount = 0;
  }
  globalRequestCount++;
  return globalRequestCount > GLOBAL_MAX_RPS;
}

// --- Combined check ---
function isServerOverloaded(): { overloaded: boolean; reason: string } {
  if (eventLoopP99 > EL_LAG_THRESHOLD_MS) {
    return {
      overloaded: true,
      reason: `Event-loop lag ${eventLoopP99.toFixed(0)}ms exceeds ${EL_LAG_THRESHOLD_MS}ms`,
    };
  }
  if (isMemoryOverloaded()) {
    return {
      overloaded: true,
      reason: `Memory usage exceeds ${(MEM_THRESHOLD * 100).toFixed(0)}%`,
    };
  }
  if (isRpsOverloaded()) {
    return {
      overloaded: true,
      reason: `Request rate exceeds ${GLOBAL_MAX_RPS} req/s`,
    };
  }
  return { overloaded: false, reason: "" };
}

// ========================================
// REDIS CONFIG
// ========================================
const redisUrl =
  process.env.REDIS_URL ||
  process.env.REDIS_TLS_URL ||
  "";

const upstashUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  "";

const upstashToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "";

let redis: any = null;
let upstash: UpstashRedis | null = null;

// ========================================
// REDIS INIT
// ========================================
if (redisUrl) {
  try {
    redis = new IORedis(redisUrl);

    redis.on("error", (e: any) => {
      console.error("Redis error:", e);
    });
  } catch (e) {
    console.error("Failed to create Redis client", e);
    redis = null;
  }
} else if (upstashUrl && upstashToken) {
  try {
    upstash = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken,
    });
  } catch (e) {
    console.error(
      "Failed to create Upstash Redis client",
      e,
    );

    upstash = null;
  }
}

// ========================================
// HELPERS
// ========================================
function getClientIp(req: any): string {
  const cloudflareIp = req.headers[
    "cf-connecting-ip"
  ] as string | undefined;

  const realIp = req.headers[
    "x-real-ip"
  ] as string | undefined;

  const forwardedIp = (
    req.headers["x-forwarded-for"] as
    | string
    | undefined
  )?.split(",")[0];

  return (
    cloudflareIp ||
    realIp ||
    forwardedIp ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function getRouteKey(req: any): string {
  const routePath = req?.route?.path
    ? String(req.route.path)
    : req.path || "unknown";

  return `${req.method || "GET"}:${routePath}`;
}

// ========================================
// RATE LIMITER FACTORY
// ========================================
export function createSimpleLimiter(
  bucket: string,
  windowMs: number,
  max: number,
  message: string,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // ========================================
      // DYNAMIC LOAD SHEDDING (85% threshold)
      // ========================================
      const load = isServerOverloaded();
      if (load.overloaded) {
        res.setHeader("Retry-After", "2");
        return res.status(503).json({
          success: false,
          message: "Server under high load. Please retry shortly.",
          reason: load.reason,
        });
      }

      // ========================================
      // PER-IP / PER-ROUTE LIMITING
      // ========================================
      const ip = getClientIp(req);
      const route = getRouteKey(req);
      const key = `${bucket}:${ip}:${route}`;
      const now = Date.now();

      // ========================================
      // REDIS MODE
      // ========================================
      if (redis) {
        const current = await redis.incr(key);

        if (current === 1) {
          await redis.pexpire(key, windowMs);
        }

        if (current > max) {
          return res.status(429).json({
            success: false,
            message,
          });
        }

        return next();
      }

      // ========================================
      // UPSTASH MODE
      // ========================================
      if (upstash) {
        const current = await upstash.incr(key);

        if (current === 1) {
          await upstash.pexpire(key, windowMs);
        }

        if (current > max) {
          return res.status(429).json({
            success: false,
            message,
          });
        }

        return next();
      }

      // ========================================
      // MEMORY FALLBACK
      // ========================================
      if (
        !requestCounts[key] ||
        requestCounts[key].resetTime < now
      ) {
        requestCounts[key] = {
          count: 1,
          resetTime: now + windowMs,
        };

        return next();
      }

      requestCounts[key].count++;

      if (requestCounts[key].count > max) {
        return res.status(429).json({
          success: false,
          message,
        });
      }

      next();
    } catch (err) {
      console.error("Rate limiter error:", err);

      // Fail-open: allow request if limiter itself breaks
      next();
    }
  };
}

// ========================================
// LIMITERS
// ========================================

/**
 * PUBLIC APIs
 * Browsing / events / dashboard
 *
 * Users need ~7 reqs for browsing flow
 */
export const publicLimiter = createSimpleLimiter(
  "public",
  60 * 1000,
  900,
  "Too many requests, please slow down",
);

/**
 * AUTH APIs
 * Login / OTP / reset
 */
export const authLimiter = createSimpleLimiter(
  "auth",
  15 * 60 * 1000,
  80,
  "Too many auth attempts, try again later",
);

/**
 * REGISTRATION APIs
 * Registration flow needs ~9 requests
 */
export const registrationLimiter =
  createSimpleLimiter(
    "registration",
    10 * 60 * 1000,
    60,
    "Too many registration attempts",
  );

/**
 * ADMIN APIs
 * Heavy polling dashboards
 */
export const adminLimiter = createSimpleLimiter(
  "admin",
  60 * 1000,
  1500,
  "Admin request limit exceeded",
);

// ========================================
// RESET (TESTING ONLY)
// ========================================
export function resetRateLimitCounts() {
  for (const k of Object.keys(requestCounts)) {
    delete requestCounts[k];
  }
}