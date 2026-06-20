import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '../types'
import { decompress } from './decompress'
import { cachedFetch } from '../cache'
import { rateLimit } from '@/lib/rate-limit'
import { extractClientIp } from '@/lib/antispam'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const HISTORY_FILE = join(process.cwd(), 'cache', 'foehn-history.json')

let lastErrorLogMs = 0
const ERROR_LOG_INTERVAL = 15 * 60 * 1000

const URL_LUGANO = 'https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/06770/kml/MOSMIX_L_LATEST_06770.kmz'
const URL_ZURICH = 'https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/06660/kml/MOSMIX_L_LATEST_06660.kmz'

type FoehnPoint = {
  time: string
  diffP: number
}

async function loadHistory(): Promise<FoehnPoint[]> {
  try {
    const raw = await readFile(HISTORY_FILE, 'utf-8')
    return JSON.parse(raw) as FoehnPoint[]
  } catch {
    return []
  }
}

async function saveHistory(points: FoehnPoint[]): Promise<void> {
  try {
    await mkdir(join(process.cwd(), 'cache'), { recursive: true })
    await writeFile(HISTORY_FILE, JSON.stringify(points))
  } catch (e) {
    console.error('[FOEHN] Failed to save history:', e)
  }
}

function mergeWithHistory(current: FoehnPoint[], history: FoehnPoint[]): FoehnPoint[] {
  const currentFirstMs = current.length > 0 ? new Date(current[0].time).getTime() : Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const cutoff = currentFirstMs - 7 * dayMs

  const relevant = history.filter(p => {
    const t = new Date(p.time).getTime()
    return t < currentFirstMs && t >= cutoff
  })

  const map = new Map<string, FoehnPoint>()
  for (const p of relevant) map.set(p.time, p)
  for (const p of current) map.set(p.time, p)

  const merged = Array.from(map.values())
  merged.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  return merged
}

async function extractPressure(url: string): Promise<{ times: string[]; pressures: number[] }> {
  const res = await fetchWithTimeout(url, 15000)
  const buffer = await res.arrayBuffer()

  const kml = await decompress(buffer)

  const timeMatches = kml.match(/<dwd:TimeStep>([^<]+)<\/dwd:TimeStep>/g) ?? []
  const times = timeMatches.map(m => {
    const match = m.match(/>([^<]+)</)
    return match ? match[1] : ''
  }).filter(Boolean)

  const ppppMatch = kml.match(/elementName="PPPP"[\s\S]*?<dwd:value>([\s\S]*?)<\/dwd:value>/)
  if (!ppppMatch) throw new Error('PPPP not found')

  const pressures = ppppMatch[1].trim().split(/\s+/).map(v => parseFloat(v) / 100)

  return { times, pressures }
}

async function fetchFoehnData(): Promise<{ data: FoehnPoint[] }> {
  const [lugano, zurich] = await Promise.all([
    extractPressure(URL_LUGANO),
    extractPressure(URL_ZURICH),
  ])

  const data: FoehnPoint[] = []
  const len = Math.min(lugano.times.length, lugano.pressures.length, zurich.pressures.length)

  for (let i = 0; i < len; i++) {
    const lP = lugano.pressures[i]
    const zP = zurich.pressures[i]
    if (isNaN(lP) || isNaN(zP)) continue

    data.push({
      time: lugano.times[i],
      diffP: Math.round((lP - zP) * 100) / 100,
    })
  }

  const history = await loadHistory()
  const merged = mergeWithHistory(data, history)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const startMs = now.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const horizonMs = startMs + 7 * dayMs
  const capped = merged.filter((p) => {
    const t = new Date(p.time).getTime()
    return !Number.isNaN(t) && t >= startMs && t < horizonMs
  })

  const toSave = data.filter(p => {
    const t = new Date(p.time).getTime()
    return t < Date.now()
  })
  if (toSave.length > 0) {
    const updatedHistory = mergeWithHistory(toSave, history)
    const pruneBefore = Date.now() - 7 * dayMs
    const pruned = updatedHistory.filter(p => new Date(p.time).getTime() >= pruneBefore)
    await saveHistory(pruned)
  }

  return { data: capped }
}

export async function GET(request: Request) {
  const { allowed } = rateLimit({ key: `vento-foehn:${extractClientIp(request)}`, limit: 30, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste.' }, { status: 429 })
  }
  try {
    const result = await cachedFetch('vento-foehn', 1800, fetchFoehnData)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=300' },
    })
  } catch (e) {
    const now = Date.now()
    if (now - lastErrorLogMs > ERROR_LOG_INTERVAL) {
      lastErrorLogMs = now
      console.error('[FOEHN] Failed to fetch forecast data:', e)
    }
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
