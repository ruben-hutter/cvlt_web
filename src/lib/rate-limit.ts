type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export function rateLimit(options: {
  key: string
  limit: number
  windowMs: number
}): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup()

  const now = Date.now()
  const entry = store.get(options.key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs
    store.set(options.key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt }
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: options.limit - entry.count, resetAt: entry.resetAt }
}
