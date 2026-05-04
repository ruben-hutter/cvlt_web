export type WindStation = {
  name: string
  isPeak: boolean
  windDir: number | null
  windAvg: number | null
  windGust: number | null
  windLevel: 'strong' | 'moderate' | 'light'
  temp: string | null
  cloudBase: string | null
  lastUpdate: string | null
  sourceUrl: string | null
}

export type LakeLevel = {
  name: string
  date: string
  level: string
  average: string
  max: string
}

export type StationsResponse = {
  timestamp: string
  stations: WindStation[]
  fetchedAt: string
}

export type LakesResponse = {
  lakes: LakeLevel[]
  fetchedAt: string
}

export function computeWindLevel(
  dir: number | null,
  avg: number | null,
  gust: number | null,
): WindStation['windLevel'] {
  const d = dir ?? -1
  const a = avg ?? 0
  const g = gust ?? 0
  const isNorth = d >= 0 && (d > 270 || d < 90)

  if (isNorth && (a > 8 || g > 15)) return 'strong'
  if (a > 40 || g > 50) return 'strong'
  if (isNorth && g > 0) return 'moderate'
  if (a > 30 || g > 35) return 'moderate'
  return 'light'
}

export function formatCloudBase(hBase: number): string | null {
  if (hBase <= 0) return null
  const rounded = Math.round((hBase + 50) / 100) * 100
  if (rounded >= 1000) {
    return `${Math.floor(rounded / 1000)}'${String(rounded % 1000).padStart(3, '0')}m`
  }
  return `${rounded}m`
}

export async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
}
