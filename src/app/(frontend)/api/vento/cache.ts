import { readFile, writeFile, rename, stat, mkdir } from 'fs/promises'
import { join } from 'path'

const CACHE_DIR = join(process.cwd(), 'cache')

// Deduplicate in-flight fetches so concurrent requests share one external call
const inflight = new Map<string, Promise<unknown>>()

export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const filePath = join(CACHE_DIR, `${key}.json`)

  // Serve from disk if fresh
  try {
    const s = await stat(filePath)
    if (Date.now() - s.mtimeMs < ttlSeconds * 1000) {
      const raw = await readFile(filePath, 'utf-8')
      return JSON.parse(raw) as T
    }
  } catch {
    // File missing or unreadable — proceed to fetch
  }

  // Deduplicate: if another request is already fetching this key, wait for it
  if (inflight.has(key)) return inflight.get(key) as Promise<T>

  const promise = (async () => {
    try {
      const data = await fetcher()
      await mkdir(CACHE_DIR, { recursive: true })
      const tmp = filePath + '.tmp'
      await writeFile(tmp, JSON.stringify(data))
      await rename(tmp, filePath)
      return data
    } catch (err) {
      // Serve stale data rather than failing
      try {
        const raw = await readFile(filePath, 'utf-8')
        console.error(`[CACHE] ${key} fetch failed, serving stale:`, err)
        return JSON.parse(raw) as T
      } catch {
        throw err
      }
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}
