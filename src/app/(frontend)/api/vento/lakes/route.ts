import { NextResponse } from 'next/server'
import type { LakeLevel, LakesResponse } from '../types'
import { cachedFetch } from '../cache'

const LAKES = [
  {
    url: 'https://www.hydrodaten.admin.ch/de/seen-und-fluesse/stationen-und-daten/2022',
    name: 'Lago Maggiore (Locarno)',
    warnLevel: 194,
  },
  {
    url: 'https://www.hydrodaten.admin.ch/de/seen-und-fluesse/stationen-und-daten/2021',
    name: 'Lago di Lugano (Ponte Tresa)',
    warnLevel: 271,
  },
]

async function fetchLakeData(
  url: string,
  defaultName: string,
): Promise<LakeLevel | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0',
        'Accept-Language': 'de',
        Referer: 'https://www.hydrodaten.admin.ch/',
      },
    })
    if (!res.ok) return null
    const html = await res.text()

    let name = defaultName
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    if (titleMatch) {
      const cleaned = titleMatch[1].replace(/\s*-\s*$/, '').trim()
      if (cleaned) name = cleaned
    }

    let date = '-'
    let level = '-'
    let average = '-'
    let max = '-'

    // Extract "Letzter Messwert" (last measurement) row
    const lastMeasMatch = html.match(
      /Letzter Messwert[\s\S]*?<div[^>]*>([\d.]+\s+[\d:]+)<\/div>[\s\S]*?<td[^>]*>\s*<div[^>]*>([\d.]+)/i,
    )
    if (lastMeasMatch) {
      date = lastMeasMatch[1].trim()
      level = lastMeasMatch[2].trim()
    }

    // Extract "Mittelwert 24h" (24h average)
    const avgMatch = html.match(/Mittelwert 24h<\/td>\s*<td[^>]*>([\d.]+)/i)
    if (avgMatch) average = avgMatch[1].trim()

    // Extract "Maximum 24h"
    const maxMatch = html.match(/Maximum 24h<\/td>\s*<td[^>]*>([\d.]+)/i)
    if (maxMatch) max = maxMatch[1].trim()

    return { name, date, level, average, max }
  } catch (e) {
    console.error(`[VENTO LAKES] Failed to fetch ${url}:`, e)
    return null
  }
}

async function fetchAllLakes(): Promise<LakesResponse> {
  const results = await Promise.all(
    LAKES.map((lake) => fetchLakeData(lake.url, lake.name)),
  )
  const lakes: LakeLevel[] = results.filter((l): l is LakeLevel => l != null)
  return { lakes, fetchedAt: new Date().toISOString() }
}

export async function GET() {
  try {
    const data = await cachedFetch('vento-lakes', 86400, fetchAllLakes)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=600' },
    })
  } catch (e) {
    console.error('[VENTO LAKES]', e)
    return NextResponse.json({ error: 'Failed to fetch lake data' }, { status: 502 })
  }
}
