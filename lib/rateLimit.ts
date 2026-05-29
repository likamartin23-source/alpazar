type WindowEntry = { count: number; resetAt: number }
const store = new Map<string, WindowEntry>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now }
}

export function getClientIp(req: Request): string {
  const headers = req.headers as Headers
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

// Prune expired entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) {
    if (now >= v.resetAt) store.delete(k)
  }
}, 5 * 60_000)
