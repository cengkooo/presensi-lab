// ======================================================
// Rate Limiter — Upstash Redis
// Sliding window: max 3 requests per 60 detik per userId
// Persistent di serverless (tidak reset saat cold start)
// ======================================================
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Lazy-init — baru dibuat saat pertama dipakai
let ratelimit: Ratelimit | null = null

function getRatelimiter(): Ratelimit {
  if (ratelimit) return ratelimit

  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(3, "60 s"),
    analytics: false,
    prefix: "presenslab:checkin",
  })

  return ratelimit
}

/**
 * Cek apakah userId masih dalam batas rate limit.
 * @returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const { success, remaining, reset } = await getRatelimiter().limit(userId)
  return {
    allowed: success,
    remaining,
    resetAt: new Date(reset),
  }
}
