import { NextResponse } from 'next/server'
import type { WindStation, StationsResponse } from '../types'
import { computeWindLevel, formatCloudBase, fetchWithTimeout } from '../types'
import { cachedFetch } from '../cache'

// ── PWS (Weather Underground) ──────────────────────────────────────────────
const PWS_BASE =
  'https://api.weather.com/v2/pws/observations/current?apiKey=6532d6454b8aa370768e63d6ba5a832e&format=json&units=m'

const PWS_STATIONS: Record<string, string> = {
  IRIVERA3: 'Rivera',
  ITICINOB2: 'Bellinzona',
  ISTAMARI2: 'Sta Maria GR',
  ILUGAGGI2: 'Skypull/Mte Bar2',
  IVAGLI1: 'Skypull/Mte Bar',
  ITESSINM2: 'Malvaglia',
  ITICINOT2: 'Taverne',
  IGORDE1: 'Gordevio',
  ILODRINO7: 'Lodrino',
}

async function fetchPWSStations(): Promise<(WindStation & { lat: number })[]> {
  const stations: (WindStation & { lat: number })[] = []

  const settled = await Promise.allSettled(
    Object.entries(PWS_STATIONS).map(async ([id, label]) => {
      const res = await fetchWithTimeout(`${PWS_BASE}&stationId=${id}`)
      if (!res.ok) return null
      const json = await res.json()
      const obs = json?.observations?.[0]
      if (!obs) return null

      const m = obs.metric
      const minutesAgo = Math.round((Date.now() / 1000 - obs.epoch) / 60)
      const windAvg = m?.windSpeed ?? null
      const windGust = m?.windGust ?? null
      const windDir = obs.winddir != null && obs.winddir <= 360 ? obs.winddir : null
      const temp = m?.temp
      const humidity = obs.humidity
      const elev = m?.elev ?? 0

      let cloudBase: string | null = null
      if (elev > 1200 && humidity > 0 && temp != null) {
        const hBaseDiff = (20 + temp / 5) * (100 - humidity)
        const hBase = Math.round((hBaseDiff + elev - 50) / 200) * 200
        cloudBase = formatCloudBase(hBase)
      }

      const station: WindStation & { lat: number } = {
        name: `PWS-${label}`,
        isPeak: elev > 700,
        windDir,
        windAvg: windAvg != null ? Math.round(windAvg) : null,
        windGust: windGust != null ? Math.round(windGust) : null,
        windLevel: computeWindLevel(windDir, windAvg, windGust),
        temp: temp != null ? `${Math.round(temp)}°C` : null,
        cloudBase,
        lastUpdate: minutesAgo >= 0 && minutesAgo < 120 ? `${minutesAgo}min` : null,
        lat: obs.lat ?? 0,
        sourceUrl: `https://www.wunderground.com/dashboard/pws/${id}`,
      }
      return station
    }),
  )

  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) stations.push(r.value)
  }
  return stations.filter((s) => !(s.windAvg === 0 && s.windDir === 0 && (s.windGust ?? 0) === 0))
}

// ── SLF (IMIS stations) ───────────────────────────────────────────────────
const SLF_INFO_URL =
  'https://public-meas-data.slf.ch/public/station-data/timepoint/TEMPERATURE_AIR/current/geojson'
const SLF_DATA_URL =
  'https://public-meas-data.slf.ch/public/station-data/timeseries/current/IMIS'

const SLF_IDS = [
  'BED1', 'MES1', 'CAM1', 'SIM1', 'VAL1', 'SIM2', 'BED2', 'MES2',
  'NAR1', 'VAL2', 'CAM2', 'MTR1', 'BED3', 'NAR2', 'DTR2', 'MTR2',
]

type SLFMeta = { lat: number; lon: number; elev: number; label: string }

async function fetchSLFStations(): Promise<(WindStation & { lat: number })[]> {
  const [infoResult, ...dataResults] = await Promise.allSettled([
    fetchWithTimeout(SLF_INFO_URL).then((r) => r.json()),
    ...SLF_IDS.map((id) =>
      fetchWithTimeout(`${SLF_DATA_URL}/${id}`).then((r) => r.json()),
    ),
  ])

  const metaMap = new Map<string, SLFMeta>()
  if (infoResult.status === 'fulfilled' && infoResult.value?.features) {
    for (const f of infoResult.value.features) {
      const code = f.properties?.code
      if (code) {
        metaMap.set(code, {
          lat: f.geometry?.coordinates?.[1] ?? 0,
          lon: f.geometry?.coordinates?.[0] ?? 0,
          elev: f.properties?.elevation ?? 0,
          label: f.properties?.label ?? code,
        })
      }
    }
  }

  const stations: (WindStation & { lat: number })[] = []

  for (let i = 0; i < SLF_IDS.length; i++) {
    const result = dataResults[i]
    if (result.status !== 'fulfilled') continue

    const data = result.value
    const id = SLF_IDS[i]
    const meta = metaMap.get(id)
    if (!meta) continue

    const windAvg = data?.windVelocityMean?.value != null
      ? Math.round(data.windVelocityMean.value) : null
    const windGust = data?.windVelocityMax?.value != null
      ? Math.round(data.windVelocityMax.value) : null
    const windDir = data?.windDirectionMean?.value != null
      ? Math.round(data.windDirectionMean.value) : null
    const temp = data?.temperatureAir?.value

    if (windAvg == null && windGust == null) continue

    const slfTimestamp = data?.windVelocityMean?.timestamp ?? data?.windVelocityMax?.timestamp
    const minutesAgo = slfTimestamp
      ? Math.round((Date.now() - new Date(slfTimestamp).getTime()) / 60000)
      : null

    const label = meta.label.replace(/\s+\d{4,}$/, '')

    stations.push({
      name: `SLF-${label}`,
      isPeak: meta.elev > 700,
      windDir: windDir != null && windDir >= 0 && windDir <= 360 ? windDir : null,
      windAvg,
      windGust,
      windLevel: computeWindLevel(windDir, windAvg, windGust),
      temp: temp != null && Math.abs(temp) < 100 ? `${Math.round(temp)}°C` : null,
      cloudBase: null,
      lastUpdate:
        minutesAgo != null && minutesAgo >= 0 && minutesAgo < 120
          ? `${minutesAgo}min`
          : null,
      lat: meta.lat,
      sourceUrl: 'https://whiterisk.ch/en/conditions/measurements/wind',
    })
  }

  return stations
}

// ── Holfuy ─────────────────────────────────────────────────────────────────
const HOLFUY_URL = 'http://widget.holfuy.com/?su=km/h&t=C&lang=en&mode=simple'

const HOLFUY_STATIONS: Record<number, { name: string; elev: number; lat: number }> = {
  969: { name: 'Alpe Foppa', elev: 1532, lat: 46.117 },
  1043: { name: 'Lago Ritom', elev: 1800, lat: 46.531 },
  1621: { name: 'Mte Lema', elev: 1621, lat: 46.040 },
}

async function fetchHolfuyStations(): Promise<(WindStation & { lat: number })[]> {
  const stations: (WindStation & { lat: number })[] = []

  const settled = await Promise.allSettled(
    Object.entries(HOLFUY_STATIONS).map(async ([idStr, info]) => {
      const res = await fetchWithTimeout(`${HOLFUY_URL}&station=${idStr}`)
      if (!res.ok) return null
      const text = await res.text()

      let windDir: number | null = null
      let windAvg: number | null = null
      let windGust: number | null = null
      let temp: number | null = null
      let lastUpdateMin: number | null = null

      for (const line of text.split('\n')) {
        const clean = line.replace(/"/g, '')
        const dirM = clean.match(/wind_dir\s*=\s*(.+)/)
        if (dirM) windDir = parseFloat(dirM[1])
        const spdM = clean.match(/wind_speed\s*=\s*(.+)/)
        if (spdM) windAvg = Math.round(parseFloat(spdM[1]))
        const gustM = clean.match(/wind_gust\s*=\s*(.+)/)
        if (gustM) windGust = Math.round(parseFloat(gustM[1]))
        const tempM = clean.match(/temperature\s*=\s*(.+)/)
        if (tempM) temp = parseFloat(tempM[1])
        const timeM = clean.match(/data_time\s*=\s*(\d+):(\d+)/)
        if (timeM) {
          const now = new Date()
          const h = parseInt(timeM[1], 10)
          const m = parseInt(timeM[2], 10)
          lastUpdateMin = (now.getHours() - h) * 60 + (now.getMinutes() - m)
          if (lastUpdateMin < 0) lastUpdateMin += 1440
        }
      }

      const station: WindStation & { lat: number } = {
        name: `HFY-${info.name}`,
        isPeak: info.elev > 700,
        windDir: windDir != null && windDir >= 0 && windDir <= 360 ? Math.round(windDir) : null,
        windAvg,
        windGust,
        windLevel: computeWindLevel(windDir, windAvg, windGust),
        temp: temp != null ? `${Math.round(temp)}°C` : null,
        cloudBase: null,
        lastUpdate:
          lastUpdateMin != null && lastUpdateMin >= 0 && lastUpdateMin < 120
            ? `${lastUpdateMin}min`
            : null,
        lat: info.lat,
        sourceUrl: `https://holfuy.com/en/weather/${idStr}`,
      }
      return station
    }),
  )

  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) stations.push(r.value)
  }
  return stations
}

// ── Windbird / Pioupiou ────────────────────────────────────────────────────
const PIOUPIOU_URL = 'https://api.pioupiou.fr/v1/live'

const WINDBIRD_STATIONS: Record<number, { name: string; elev: number; lat: number }> = {
  2068: { name: 'AlpeMatro', elev: 1140, lat: 46.137 },
  2075: { name: 'Carlazzo', elev: 920, lat: 46.054 },
  1322: { name: 'StaMariaGR', elev: 1218, lat: 46.267 },
}

async function fetchWindbirdStations(): Promise<(WindStation & { lat: number })[]> {
  const stations: (WindStation & { lat: number })[] = []

  const settled = await Promise.allSettled(
    Object.entries(WINDBIRD_STATIONS).map(async ([idStr, info]) => {
      const res = await fetchWithTimeout(`${PIOUPIOU_URL}/${idStr}`)
      if (!res.ok) return null
      const json = await res.json()
      const d = json?.data
      if (!d) return null

      const meas = d.measurements
      const windAvg = meas?.wind_speed_avg != null ? Math.round(meas.wind_speed_avg) : null
      const windGust = meas?.wind_speed_max != null ? Math.round(meas.wind_speed_max) : null
      const windDir = meas?.wind_heading != null ? Math.round(meas.wind_heading) : null

      let minutesAgo: number | null = null
      if (meas?.date) {
        minutesAgo = Math.round((Date.now() - new Date(meas.date).getTime()) / 60000)
      }

      const station: WindStation & { lat: number } = {
        name: `WBD-${info.name}`,
        isPeak: info.elev > 700,
        windDir: windDir != null && windDir >= 0 && windDir <= 360 ? windDir : null,
        windAvg,
        windGust,
        windLevel: computeWindLevel(windDir, windAvg, windGust),
        temp: null as string | null,
        cloudBase: null as string | null,
        lastUpdate:
          minutesAgo != null && minutesAgo >= 0 && minutesAgo < 120
            ? `${minutesAgo}min`
            : null,
        lat: d.location?.latitude ?? info.lat,
        sourceUrl: `https://www.openwindmap.org/windbird-${idStr}`,
      }
      return station
    }),
  )

  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) stations.push(r.value)
  }
  return stations
}

// ── Faido ──────────────────────────────────────────────────────────────────
const FAIDO_URL = 'http://www.tencia.ch/data/allsensors.txt'
const FAIDO_LAT = 46.478

async function fetchFaidoStation(): Promise<(WindStation & { lat: number }) | null> {
  try {
    const res = await fetchWithTimeout(FAIDO_URL, 5000)
    if (!res.ok) return null
    const text = await res.text()

    let temp: number | null = null
    let windDir: number | null = null
    let windAvg: number | null = null
    let windGust: number | null = null
    let utcDate: number | null = null

    for (const line of text.split('\n')) {
      const utcM = line.match(/actual_utcdate\s+(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)
      if (utcM) {
        utcDate = Date.UTC(+utcM[1], +utcM[2] - 1, +utcM[3], +utcM[4], +utcM[5], +utcM[6])
      }
      const tempM = line.match(/actual_th0_temp_c\s+(.+)/)
      if (tempM) temp = parseFloat(tempM[1])
      const dirM = line.match(/last15m_wind0_maindir_deg\s+(.+)/)
      if (dirM) windDir = Math.round(parseFloat(dirM[1]))
      const spdM = line.match(/last15m_wind0_gustspeed_kmh\s+(.+)/)
      if (spdM) windAvg = Math.round(parseFloat(spdM[1]))
      const gustM = line.match(/last15m_wind0_gustspeedmax_kmh\s+(.+)/)
      if (gustM) windGust = Math.round(parseFloat(gustM[1]))
    }

    const minutesAgo = utcDate != null ? Math.round((Date.now() - utcDate) / 60000) : null

    return {
      name: 'Faido',
      isPeak: false,
      windDir: windDir != null && windDir >= 0 && windDir <= 360 ? windDir : null,
      windAvg,
      windGust,
      windLevel: computeWindLevel(windDir, windAvg, windGust),
      temp: temp != null ? `${Math.round(temp)}°C` : null,
      cloudBase: null,
      lastUpdate:
        minutesAgo != null && minutesAgo >= 0 && minutesAgo < 120
          ? `${minutesAgo}min`
          : null,
      lat: FAIDO_LAT,
      sourceUrl: 'http://www.tencia.ch/data/11___24h_Wind.png',
    }
  } catch {
    return null
  }
}

// ── Main route ─────────────────────────────────────────────────────────────

async function fetchAllOthers(): Promise<StationsResponse> {
  const [pwsList, slfList, holfuyList, windbirdList, faido] = await Promise.all([
    fetchPWSStations().catch(() => [] as (WindStation & { lat: number })[]),
    fetchSLFStations().catch(() => [] as (WindStation & { lat: number })[]),
    fetchHolfuyStations().catch(() => [] as (WindStation & { lat: number })[]),
    fetchWindbirdStations().catch(() => [] as (WindStation & { lat: number })[]),
    fetchFaidoStation().catch(() => null),
  ])

  const all = [...pwsList, ...slfList, ...holfuyList, ...windbirdList]
  if (faido) all.push(faido)

  all.sort((a, b) => b.lat - a.lat)
  const stations: WindStation[] = all.map(({ lat: _lat, ...rest }) => rest)

  const now = new Date()
  const timestamp = now.toLocaleString('it-CH', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Zurich',
  })

  return { timestamp, stations, fetchedAt: now.toISOString() }
}

export async function GET() {
  try {
    const data = await cachedFetch('vento-others', 300, fetchAllOthers)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' },
    })
  } catch (e) {
    console.error('[VENTO OTHERS]', e)
    return NextResponse.json({ error: 'Failed to fetch other station data' }, { status: 502 })
  }
}
