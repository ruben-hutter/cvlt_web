# Foehn Forecast — DNS Resilience

## Problem

The foehn forecast API route (`/api/vento/foehn`) repeatedly fails with DNS resolution errors when the Infomaniak server cannot resolve `opendata.dwd.de`:

```
getaddrinfo EAI_AGAIN opendata.dwd.de
```

- The DWD endpoint itself is healthy (verified externally, returns HTTP 200)
- The issue is intermittent DNS failure on the Infomaniak shared hosting resolver
- Errors are very noisy in logs (every 15 min cache expiry triggers a new failed fetch)
- If no stale cache file exists on disk (e.g. after a deploy), the stale fallback also fails → returns 500 to clients

## Root Cause

1. Cache expires (900s / 15 min TTL) → triggers fetch
2. DNS fails (`EAI_AGAIN`) → `fetchFoehnData()` throws
3. `cachedFetch()` tries stale fallback from disk → no cache file → also throws
4. Route catch block logs `[FOEHN]` error, returns `{ data: [] }` with status 500
5. Next client poll → same cycle repeats

## Recommended Improvements

### 1. Retry logic for DNS failures
- In `fetchFoehnData()` or `fetchWithTimeout()`, add 1-2 retries with a short delay (1-2s) on DNS errors (`EAI_AGAIN`, `ENOTFOUND`, `ECONNREFUSED`)
- Simple `for` loop with `try/catch`, no external library needed

### 2. Reduce log noise
- Track last error timestamp in the route, only log once per cache cycle instead of per request
- Or downgrade to `console.warn` with a throttle

### 3. Pre-seed cache on deploy
- Add a post-build step or startup script that warms the foehn cache with a single fetch
- Ensures stale fallback has data even after deploys

### 4. Longer cache TTL
- Consider increasing TTL from 900s (15 min) to 1800s (30 min) — MOSMIX-L data updates every 6 hours anyway
- Reduces fetch frequency and DNS exposure

## Files to Modify

- `src/app/(frontend)/api/vento/foehn/route.ts` — retry logic, log throttling
- `src/app/(frontend)/api/vento/types.ts` — optional: retry helper in `fetchWithTimeout`
- `src/app/(frontend)/api/vento/cache.ts` — optional: longer TTL consideration
