import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '../types'
import { decompress } from './decompress'
import { cachedFetch } from '../cache'

// DWD MOSMIX-L forecast data for Lugano (06770) and Zürich (06660)
const URL_LUGANO = 'https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/06770/kml/MOSMIX_L_LATEST_06770.kmz'
const URL_ZURICH = 'https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/06660/kml/MOSMIX_L_LATEST_06660.kmz'

type FoehnPoint = {
  time: string
  diffP: number
}

async function extractPressure(url: string): Promise<{ times: string[]; pressures: number[] }> {
  const res = await fetchWithTimeout(url, 15000)
  const buffer = await res.arrayBuffer()

  // KMZ is a zip file — decompress to get KML
  const kml = await decompress(buffer)

  // Extract timestamps
  const timeMatches = kml.match(/<dwd:TimeStep>([^<]+)<\/dwd:TimeStep>/g) ?? []
  const times = timeMatches.map(m => {
    const match = m.match(/>([^<]+)</)
    return match ? match[1] : ''
  }).filter(Boolean)

  // Extract PPPP (pressure in Pa)
  const ppppMatch = kml.match(/elementName="PPPP"[\s\S]*?<dwd:value>([\s\S]*?)<\/dwd:value>/)
  if (!ppppMatch) throw new Error('PPPP not found')

  const pressures = ppppMatch[1].trim().split(/\s+/).map(v => parseFloat(v) / 100) // Pa → hPa

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

  return { data }
}

export async function GET() {
  try {
    const result = await cachedFetch('vento-foehn', 900, fetchFoehnData)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=900, stale-while-revalidate=300' },
    })
  } catch (e) {
    console.error('[FOEHN] Failed to fetch forecast data:', e)
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
