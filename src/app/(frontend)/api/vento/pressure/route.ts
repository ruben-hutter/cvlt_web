import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '../types'

const URL_KLO = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/klo/ogd-smn_klo_h_recent.csv'
const URL_MAG = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/mag/ogd-smn_mag_h_recent.csv'
const URL_MTR = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/mtr/ogd-smn_mtr_h_recent.csv'

type PressurePoint = {
  time: string
  diffP: number | null
  diffT: number | null
  windMTR: number | null
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
  // Format: "DD.MM.YYYY HH:mm"
  const match = ts.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, day, month, year, hour, minute] = match
  return new Date(+year, +month - 1, +day, +hour, +minute)
}

export async function GET() {
  try {
    const [kloText, magText, mtrText] = await Promise.all([
      fetchWithTimeout(URL_KLO, 10000).then(r => r.text()),
      fetchWithTimeout(URL_MAG, 10000).then(r => r.text()),
      fetchWithTimeout(URL_MTR, 10000).then(r => r.text()),
    ])

    const kloRows = parseCSV(kloText)
    const magRows = parseCSV(magText)
    const mtrRows = parseCSV(mtrText)

    const kloMap = new Map<string, { p: number; t: number }>()
    for (const r of kloRows) {
      const p = parseFloat(r.pp0qnhh0)
      const t = parseFloat(r.tre200h0)
      if (!isNaN(p)) kloMap.set(r.reference_timestamp, { p, t })
    }

    const mtrMap = new Map<string, number>()
    for (const r of mtrRows) {
      const w = parseFloat(r.fu3010h0)
      if (!isNaN(w)) mtrMap.set(r.reference_timestamp, w)
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const data: PressurePoint[] = []
    for (const r of magRows) {
      const ts = r.reference_timestamp
      const date = parseTimestamp(ts)
      if (!date || date < sevenDaysAgo) continue

      const magP = parseFloat(r.pp0qnhh0)
      const magT = parseFloat(r.tre200h0)
      const klo = kloMap.get(ts)
      const mtrWind = mtrMap.get(ts)

      data.push({
        time: date.toISOString(),
        diffP: klo && !isNaN(magP) ? Math.round((magP - klo.p) * 100) / 100 : null,
        diffT: klo && !isNaN(magT) ? Math.round((magT - klo.t) * 100) / 100 : null,
        windMTR: mtrWind ?? null,
      })
    }

    data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    return NextResponse.json({ data })
  } catch (e) {
    console.error('[PRESSURE] Failed to fetch pressure data:', e)
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
