import { NextResponse } from 'next/server'

const BASE = 'https://vento.cvlt.ch'

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { next: { revalidate: 120 } })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.text()
}

function decodeHtml(s: string): string {
  return s
    .replace(/&deg;/g, '°')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&egrave;/g, 'è')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]*>/g, '')).trim()
}

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
  graphUrl: string | null
}

export type LakeLevel = {
  name: string
  location: string
  date: string
  level: string
  average: string
  max: string
}

export type ForecastSite = {
  name: string
  top: string
  distance: string
  flyability: number
  level: 'good' | 'moderate' | 'poor'
  graphUrl: string | null
}

export type ForecastDay = {
  date: string
  sites: ForecastSite[]
}

export type VentoData = {
  mch: { timestamp: string; stations: WindStation[] }
  others: { timestamp: string; stations: WindStation[] }
  lakes: LakeLevel[]
  forecast: ForecastDay[]
  images: { pressure: string; foehn: string }
  fetchedAt: string
}

function parseWindStations(html: string): { timestamp: string; stations: WindStation[] } {
  const timeMatch = html.match(/(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/)
  const timestamp = timeMatch?.[1] || ''

  const stations: WindStation[] = []
  const rowRegex = /<TR[^>]*>([\s\S]*?)<\/TR>/gi
  let match

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1]
    const tds = row.match(/<TD[^>]*>[\s\S]*?<\/TD>/gi)
    if (!tds || tds.length < 5) continue

    const nameTd = tds[0]
    const isPeak = nameTd.includes('peak.png')
    const nameMatch = nameTd.match(/(?:peak\.png|empty\.gif)[^>]*>\s*([\s\S]*?)<\/TD>/i)
    const name = nameMatch ? stripTags(nameMatch[1]) : stripTags(nameTd).replace(/.*?([\w])/,'$1')
    if (!name || name.includes('stazione')) continue

    const dirMatch = tds[1]?.match(/dx\/(\d+)\.gif/)
    const windDir = dirMatch ? parseInt(dirMatch[1], 10) : null

    const speedTd = tds[2] || ''
    const speedMatch = speedTd.match(/(\d+)\s*-\s*(\d+)/)
    const windAvg = speedMatch ? parseInt(speedMatch[1], 10) : null
    const windGust = speedMatch ? parseInt(speedMatch[2], 10) : null
    const windLevel: WindStation['windLevel'] =
      speedTd.includes('id=z1') || speedTd.includes("id='z1'") ? 'strong' :
      speedTd.includes('id=z2') || speedTd.includes("id='z2'") ? 'moderate' : 'light'

    const graphMatch = speedTd.match(/HREF="([^"]+)"/)
    const graphUrl = graphMatch?.[1] || null

    const tempMatch = tds[3]?.match(/(-?\d+)(?:&deg;|°)C/)
    const temp = tempMatch ? `${tempMatch[1]}°C` : null

    const baseMatch = tds[4] ? stripTags(tds[4]).match(/[\d']+m/) : null
    const cloudBase = baseMatch?.[0] || null

    const updateMatch = tds[5] ? stripTags(tds[5]).match(/(\d+min)/) : null
    const lastUpdate = updateMatch?.[1] || null

    stations.push({ name, isPeak, windDir, windAvg, windGust, windLevel, temp, cloudBase, lastUpdate, graphUrl })
  }

  return { timestamp, stations }
}

function parseLakes(html: string): LakeLevel[] {
  const lakes: LakeLevel[] = []
  const rowRegex = /<TR[^>]*>([\s\S]*?)<\/TR>/gi
  let match

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1]
    const tds = row.match(/<TD[^>]*>[\s\S]*?<\/TD>/gi)
    if (!tds || tds.length < 5) continue

    const firstTd = stripTags(tds[0])
    const nameMatch = firstTd.match(/^(.*?)\s+([\wà-ü]+)$/i)
    const name = nameMatch?.[1]?.trim() || firstTd
    const location = nameMatch?.[2]?.trim() || ''

    lakes.push({
      name,
      location,
      date: stripTags(tds[1]),
      level: stripTags(tds[2]),
      average: stripTags(tds[3]),
      max: stripTags(tds[4]),
    })
  }

  return lakes
}

function parseForecast(html: string): ForecastDay[] {
  const days: ForecastDay[] = []

  const dateSplits = html.split(/ROWSPAN=\d+>/)
  for (const section of dateSplits) {
    const dateMatch = section.match(/(\d{4}-\d{2}-\d{2})/)
    if (!dateMatch) continue

    const date = dateMatch[1]
    const sites: ForecastSite[] = []

    const rowRegex = /<TR[^>]*>([\s\S]*?)<\/TR>/gi
    let match
    while ((match = rowRegex.exec(section)) !== null) {
      const row = match[1]
      const tds = row.match(/<TD[^>]*>[\s\S]*?<\/TD>/gi)
      if (!tds || tds.length < 4) continue

      const name = stripTags(tds[0])
      if (!name) continue

      const top = stripTags(tds[1])
      const distance = stripTags(tds[2])

      const flyMatch = stripTags(tds[3]).match(/(\d+)%/)
      const flyability = flyMatch ? parseInt(flyMatch[1], 10) : 0
      const level: ForecastSite['level'] = flyability >= 80 ? 'good' : flyability >= 60 ? 'moderate' : 'poor'

      const graphMatch = tds[3].match(/HREF='([^']+)'/)
      const graphUrl = graphMatch ? `${BASE}/${graphMatch[1]}` : null

      sites.push({ name, top, distance, flyability, level, graphUrl })
    }

    if (sites.length > 0) {
      days.push({ date, sites })
    }
  }

  return days
}

export async function GET() {
  try {
    const [mchHtml, othersHtml, lakesHtml, forecastHtml] = await Promise.all([
      fetchText(`${BASE}/get_data_mch.php`),
      fetchText(`${BASE}/get_data_others.php`),
      fetchText(`${BASE}/get_data_see.php`),
      fetchText(`${BASE}/get_cimetta_forecast.php`),
    ])

    const data: VentoData = {
      mch: parseWindStations(mchHtml),
      others: parseWindStations(othersHtml),
      lakes: parseLakes(lakesHtml),
      forecast: parseForecast(forecastHtml),
      images: {
        pressure: `${BASE}/hpa.cvlt.gif`,
        foehn: `${BASE}/wp/cache_meteo//foehndiagramm.png`,
      },
      fetchedAt: new Date().toISOString(),
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    })
  } catch (e) {
    console.error('[VENTO API]', e)
    return NextResponse.json({ error: 'Failed to fetch vento data' }, { status: 502 })
  }
}
