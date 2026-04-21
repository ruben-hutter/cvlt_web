import Fuse from 'fuse.js'

function sequentialMatch(query: string, text: string): boolean {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: string[],
  options?: { threshold?: number },
): T[] {
  if (!query.trim()) return items

  const trimmed = query.trim()

  const fuseResults = new Set(
    new Fuse(items, {
      keys,
      threshold: options?.threshold ?? 0.4,
      ignoreLocation: true,
    })
      .search(trimmed)
      .map((r) => r.item),
  )

  const seqResults = items.filter((item) =>
    keys.some((key) => {
      const val = (item as Record<string, unknown>)[key]
      return typeof val === 'string' && sequentialMatch(trimmed, val)
    }),
  )

  const seen = new Set<unknown>()
  const merged: T[] = []
  for (const item of seqResults) {
    if (!seen.has(item)) {
      seen.add(item)
      merged.push(item)
    }
  }
  for (const item of fuseResults) {
    if (!seen.has(item)) {
      seen.add(item)
      merged.push(item)
    }
  }

  return merged
}
