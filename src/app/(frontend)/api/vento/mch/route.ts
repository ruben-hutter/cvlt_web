import { NextResponse } from 'next/server'
import type { WindStation, StationsResponse } from '../types'
import { computeWindLevel, formatCloudBase, fetchWithTimeout } from '../types'
import { cachedFetch } from '../cache'

const MCH_URL =
  'https://s3-eu-central-1.amazonaws.com/app-prod-static-fra.meteoswiss-app.ch/v1/currentWeather.json'

const STATIONS: Record<string, { name: string; elev: number; chx: number; mchId: string; isPeak?: boolean }> = {
  GUE: { name: 'Gottardo', elev: 2283, chx: 167426, mchId: 'GUE', isPeak: true },
  PIO: { name: 'Piotta', elev: 990, chx: 152284, mchId: 'PIO', isPeak: false },
  SBE: { name: 'San Bernardino', elev: 1639, chx: 147345, mchId: 'SBE', isPeak: true },
  COM: { name: 'Comprovasco', elev: 575, chx: 146503, mchId: 'COM', isPeak: false },
  ROE: { name: 'Robiei', elev: 1896, chx: 144082, mchId: 'ROE', isPeak: true },
  MTR: { name: 'Matro', elev: 2200, chx: 140944, mchId: 'MTR', isPeak: true },
  BIA: { name: 'Biasca', elev: 278, chx: 132785, mchId: 'BIA', isPeak: false },
  CEV: { name: 'Cevio', elev: 417, chx: 130509, mchId: 'CEV', isPeak: false },
  GRO: { name: 'Grono', elev: 324, chx: 124081, mchId: 'GRO', isPeak: false },
  CIM: { name: 'Cimetta', elev: 1661, chx: 117405, mchId: 'CIM', isPeak: true },
  OTL: { name: 'Locarno', elev: 367, chx: 114288, mchId: 'OTL', isPeak: false },
  MAG: { name: 'Cadenazzo', elev: 203, chx: 113158, mchId: 'MAG', isPeak: false },
  LUG: { name: 'Lugano', elev: 273, chx: 95858, mchId: 'LUG', isPeak: false },
  GEN: { name: 'Generoso', elev: 1600, chx: 87500, mchId: 'GEN', isPeak: true },
  SBO: { name: 'Stabio', elev: 353, chx: 77922, mchId: 'SBO', isPeak: false },
}

// Sorted north → south by CH1903 X coordinate (matches original Perl ordering)
const STATION_ORDER = [
  'GUE', 'PIO', 'SBE', 'COM', 'ROE', 'MTR', 'BIA', 'CEV', 'GRO',
  'CIM', 'OTL', 'MAG', 'LUG', 'GEN', 'SBO',
]

async function fetchMCHData(): Promise<StationsResponse> {
  const res = await fetchWithTimeout(MCH_URL, 10000)
  if (!res.ok) throw new Error(`MCH fetch failed: ${res.status}`)
  const json = await res.json()

  const smnTime: number = json.smnTime
  const timestamp = new Date(smnTime).toLocaleString('it-CH', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Zurich',
  })

  const stations: WindStation[] = STATION_ORDER
    .filter((id) => json.data?.[id])
    .map((id) => {
      const d = json.data[id]
      const info = STATIONS[id]
      const obsTime = d.smnTime || smnTime

      const windSpeed = d.windSpeed != null ? Math.round(d.windSpeed) : null
      const windGust = d.windGust != null ? Math.round(d.windGust) : null
      const windDir =
        d.windDirection != null && d.windDirection >= 0 && d.windDirection <= 360
          ? Math.round(d.windDirection)
          : null
      const temp =
        d.temperature != null && Math.abs(d.temperature) < 100 ? d.temperature : null
      const humidity =
        d.humidity != null && d.humidity > 0 && d.humidity < 120 ? d.humidity : null

      let cloudBase: string | null = null
      if (info.elev > 1200 && humidity != null && temp != null) {
        const hBaseDiff = (20 + temp / 5) * (100 - humidity)
        const hBase = Math.round((hBaseDiff + info.elev - 50) / 200) * 200
        cloudBase = formatCloudBase(hBase)
      }

      return {
        name: info.name,
        isPeak: info.isPeak ?? info.elev > 700,
        windDir,
        windAvg: windSpeed != null && windSpeed >= 0 && windSpeed <= 360 ? windSpeed : null,
        windGust: windGust != null && windGust >= 0 && windGust <= 360 ? windGust : null,
        windLevel: computeWindLevel(windDir, windSpeed, windGust),
        temp: temp != null ? `${Math.round(temp)}°C` : null,
        cloudBase,
        lastUpdate: obsTime,
        sourceUrl: `https://www.meteosvizzera.admin.ch/servizi-e-pubblicazioni/applicazioni/valori-attuali.html#param=messwerte-windgeschwindigkeit-kmh-10min&station=${info.mchId}`,
      }
    })
    .filter((s) => {
      if (s.windAvg === 0 && s.windDir === 0 && (s.windGust ?? 0) === 0) return false
      const minutesAgo = Math.round((Date.now() - s.lastUpdate!) / 60000)
      if (minutesAgo < 0 || minutesAgo >= 120) return false
      return true
    })

  return { timestamp, stations, fetchedAt: new Date().toISOString() }
}

export async function GET() {
  try {
    const data = await cachedFetch('vento-mch', 300, fetchMCHData)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    })
  } catch (e) {
    console.error('[VENTO MCH]', e)
    return NextResponse.json({ error: 'Failed to fetch MeteoSwiss data' }, { status: 502 })
  }
}
