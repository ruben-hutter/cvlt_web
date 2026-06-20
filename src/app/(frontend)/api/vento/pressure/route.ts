import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '../types'
import { cachedFetch } from '../cache'
import { rateLimit } from '@/lib/rate-limit'
import { extractClientIp } from '@/lib/antispam'

const BASE = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn'

const URLS = {
  recent: {
    klo: `${BASE}/klo/ogd-smn_klo_h_recent.csv`,
    otl: `${BASE}/otl/ogd-smn_otl_h_recent.csv`,
    mtr: `${BASE}/mtr/ogd-smn_mtr_h_recent.csv`,
  },
  now: {
    klo: `${BASE}/klo/ogd-smn_klo_h_now.csv`,
    otl: `${BASE}/otl/ogd-smn_otl_h_now.csv`,
    mtr: `${BASE}/mtr/ogd-smn_mtr_h_now.csv`,
  },
  tenMin: {
    klo: `${BASE}/klo/ogd-smn_klo_t_now.csv`,
    otl: `${BASE}/otl/ogd-smn_otl_t_now.csv`,
    mtr: `${BASE}/mtr/ogd-smn_mtr_t_now.csv`,
  },
}

type PressurePoint = {
  time: string
  diffP: number | null
  diffT: number | null
  windMTR: number | null
}

type NormalizedRow = {
  ts: string
  p: number | null
  t: number | null
  w: number | null
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(';')
  return lines.slice(1).map(line => {
    const values = line.split(';')
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

function parseTimestamp(ts: string): Date | null {
  const match = ts.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, day, month, year, hour, minute] = match
  return new Date(+year, +month - 1, +day, +hour, +minute)
}

function normalizeHourly(rows: Record<string, string>[]): NormalizedRow[] {
  return rows.map(r => ({
    ts: r.reference_timestamp,
    p: parseFloat(r.pp0qnhh0) || null,
    t: parseFloat(r.tre200h0) || null,
    w: parseFloat(r.fu3010h0) || null,
  }))
}

function normalize10min(rows: Record<string, string>[]): NormalizedRow[] {
  const hourly = rows
    .filter(r => /:00$/.test(r.reference_timestamp?.trim() ?? ''))
    .map(r => ({
      ts: r.reference_timestamp,
      p: parseFloat(r.pp0qnhs0) || null,
      t: parseFloat(r.tre200s0) || null,
      w: parseFloat(r.fu3010z0) || null,
    }))

  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null
  if (lastRow?.reference_timestamp && !/:00$/.test(lastRow.reference_timestamp.trim())) {
    hourly.push({
      ts: lastRow.reference_timestamp,
      p: parseFloat(lastRow.pp0qnhs0) || null,
      t: parseFloat(lastRow.tre200s0) || null,
      w: parseFloat(lastRow.fu3010z0) || null,
    })
  }

  return hourly
}

async function fetchCSVText(url: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(url, 10000)
    return await res.text()
  } catch {
    return ''
  }
}

function mergeRows(allSets: NormalizedRow[][]): Map<string, NormalizedRow> {
  const map = new Map<string, NormalizedRow>()
  for (const set of allSets) {
    for (const r of set) {
      if (!r.ts) continue
      const existing = map.get(r.ts)
      if (!existing) {
        map.set(r.ts, { ...r })
      } else {
        if (r.p != null) existing.p = r.p
        if (r.t != null) existing.t = r.t
        if (r.w != null) existing.w = r.w
      }
    }
  }
  return map
}

async function fetchPressureData(): Promise<{ data: PressurePoint[] }> {
  const [
    kloRecent, kloNow, kloTenMin,
    otlRecent, otlNow, otlTenMin,
    mtrRecent, mtrNow, mtrTenMin,
  ] = await Promise.all([
    fetchCSVText(URLS.recent.klo), fetchCSVText(URLS.now.klo), fetchCSVText(URLS.tenMin.klo),
    fetchCSVText(URLS.recent.otl), fetchCSVText(URLS.now.otl), fetchCSVText(URLS.tenMin.otl),
    fetchCSVText(URLS.recent.mtr), fetchCSVText(URLS.now.mtr), fetchCSVText(URLS.tenMin.mtr),
  ])

  const kloMap = mergeRows([
    normalizeHourly(parseCSV(kloRecent)),
    normalizeHourly(parseCSV(kloNow)),
    normalize10min(parseCSV(kloTenMin)),
  ])
  const otlMap = mergeRows([
    normalizeHourly(parseCSV(otlRecent)),
    normalizeHourly(parseCSV(otlNow)),
    normalize10min(parseCSV(otlTenMin)),
  ])
  const mtrMap = mergeRows([
    normalizeHourly(parseCSV(mtrRecent)),
    normalizeHourly(parseCSV(mtrNow)),
    normalize10min(parseCSV(mtrTenMin)),
  ])

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const allTimestamps = new Set([...otlMap.keys(), ...kloMap.keys(), ...mtrMap.keys()])

  const data: PressurePoint[] = []
  for (const ts of allTimestamps) {
    const date = parseTimestamp(ts)
    if (!date || date < sevenDaysAgo) continue

    const otl = otlMap.get(ts)
    const klo = kloMap.get(ts)
    const mtr = mtrMap.get(ts)

    data.push({
      time: date.toISOString(),
      diffP: klo?.p != null && otl?.p != null ? Math.round((otl.p - klo.p) * 100) / 100 : null,
      diffT: klo?.t != null && otl?.t != null ? Math.round((otl.t - klo.t) * 100) / 100 : null,
      windMTR: mtr?.w ?? null,
    })
  }

  data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  return { data }
}

export async function GET(request: Request) {
  const { allowed } = rateLimit({ key: `vento-pressure:${extractClientIp(request)}`, limit: 30, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste.' }, { status: 429 })
  }
  try {
    const result = await cachedFetch('vento-pressure', 300, fetchPressureData)
    return NextResponse.json(result)
  } catch (e) {
    console.error('[PRESSURE] Failed to fetch pressure data:', e)
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
