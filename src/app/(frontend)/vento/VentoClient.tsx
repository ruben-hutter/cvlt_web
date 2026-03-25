'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WindStation, LakeLevel, StationsResponse, LakesResponse } from '../api/vento/types'

function WindArrow({ degrees, size = 28 }: { degrees: number; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${(degrees + 180) % 360}deg)` }}
      className="inline-block"
    >
      <path d="M12 2 L8 14 L12 11 L16 14 Z" fill="currentColor" />
    </svg>
  )
}

function windLevelColor(level: WindStation['windLevel']) {
  switch (level) {
    case 'strong': return 'text-red-600'
    case 'moderate': return 'text-amber-600'
    default: return 'text-cvlt-gray-900'
  }
}

function windLevelBorder(level: WindStation['windLevel']) {
  switch (level) {
    case 'strong': return 'border-red-300 bg-red-50/50'
    case 'moderate': return 'border-amber-200 bg-amber-50/30'
    default: return 'border-cvlt-gray-200'
  }
}

function StationCard({ station }: { station: WindStation }) {
  return (
    <div className={`rounded-lg border p-3 transition-shadow hover:shadow-md ${windLevelBorder(station.windLevel)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {station.isPeak ? (
              <svg className="h-4 w-4 flex-shrink-0 text-cvlt-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 flex-shrink-0 text-cvlt-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="16" width="20" height="2" rx="1" />
              </svg>
            )}
            <span className="truncate text-sm font-semibold text-cvlt-gray-900">{station.name}</span>
          </div>
        </div>
        {station.lastUpdate && (
          <span className="flex-shrink-0 text-xs text-cvlt-gray-400">{station.lastUpdate}</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {station.windDir !== null && (
            <span className="text-cvlt-gray-500" title={`${station.windDir}°`}>
              <WindArrow degrees={station.windDir} />
            </span>
          )}
          <span className={`text-lg font-bold tabular-nums ${windLevelColor(station.windLevel)}`}>
            {station.windAvg !== null ? (
              <>{station.windAvg}<span className="text-xs font-normal"> - </span>{station.windGust}</>
            ) : '—'}
          </span>
          <span className="text-xs text-cvlt-gray-400">km/h</span>
        </div>

        {station.temp && (
          <span className="text-sm text-cvlt-gray-600">{station.temp}</span>
        )}

        {station.cloudBase && (
          <span className="text-xs text-green-700">{station.cloudBase}</span>
        )}
      </div>
    </div>
  )
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="animate-pulse">
      <h2 className="text-lg font-bold text-cvlt-gray-900">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-cvlt-gray-200 bg-cvlt-gray-50" />
        ))}
      </div>
    </section>
  )
}

function SectionError({ title }: { title: string }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-cvlt-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-cvlt-gray-400">Dati non disponibili al momento.</p>
    </section>
  )
}

function StationsSection({ title, timestamp, stations }: { title: string; timestamp: string; stations: WindStation[] }) {
  if (stations.length === 0) return null

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-cvlt-gray-900">{title}</h2>
        {timestamp && <span className="text-xs text-cvlt-gray-400">{timestamp}</span>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stations.map((s, i) => <StationCard key={`${s.name}-${i}`} station={s} />)}
      </div>
    </section>
  )
}

function LakesSection({ lakes }: { lakes: LakeLevel[] }) {
  if (lakes.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-cvlt-gray-900">Laghi</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cvlt-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-cvlt-gray-500">
              <th className="py-2 pr-4">Lago</th>
              <th className="py-2 pr-4">Aggiornamento</th>
              <th className="py-2 pr-4 text-right">Livello</th>
              <th className="py-2 pr-4 text-right">Media</th>
              <th className="py-2 text-right">Max</th>
            </tr>
          </thead>
          <tbody>
            {lakes.map((lake, i) => (
              <tr key={i} className="border-b border-cvlt-gray-100">
                <td className="py-2 pr-4 font-medium text-cvlt-gray-900">{lake.name}</td>
                <td className="py-2 pr-4 text-cvlt-gray-500">{lake.date}</td>
                <td className="py-2 pr-4 text-right font-semibold tabular-nums text-cvlt-gray-900">{lake.level}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-cvlt-gray-500">{lake.average}</td>
                <td className="py-2 text-right tabular-nums text-cvlt-gray-500">{lake.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PressureSection() {
  return (
    <section>
      <h2 className="text-lg font-bold text-cvlt-gray-900">Pressione</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-cvlt-gray-600">Pressione attuale</h3>
          <img
            src="https://vento.cvlt.ch/hpa.cvlt.gif"
            alt="Pressione attuale"
            className="w-full rounded-lg border border-cvlt-gray-200"
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-cvlt-gray-600">Diagramma del föhn</h3>
          <img
            src="https://vento.cvlt.ch/wp/cache_meteo//foehndiagramm.png"
            alt="Diagramma del föhn"
            className="w-full rounded-lg border border-cvlt-gray-200"
          />
        </div>
      </div>
    </section>
  )
}

function Legend() {
  return (
    <aside className="hidden flex-shrink-0 lg:block lg:w-44">
      <div className="sticky top-20 space-y-3 rounded-lg border border-cvlt-gray-200 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-cvlt-gray-400">Legenda</h3>
        <div className="space-y-2.5 text-xs text-cvlt-gray-600">
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-cvlt-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
            </svg>
            Vetta
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-cvlt-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="16" width="20" height="2" rx="1" />
            </svg>
            Fondovalle
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-red-300 bg-red-50" />
            <span className="text-red-600">&gt;15 km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-amber-200 bg-amber-50" />
            <span className="text-amber-600">5–15 km/h</span>
          </div>
          <div className="pt-1 text-cvlt-gray-400">
            Velocità media – raffica
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Forecast section (commented out — enable when needed) ──────────────────
//
// type ForecastSite = {
//   name: string; top: string; distance: string; flyability: number
//   level: 'good' | 'moderate' | 'poor'; graphUrl: string | null
// }
// type ForecastDay = { date: string; sites: ForecastSite[] }
//
// function ForecastSection({ forecast }: { forecast: ForecastDay[] }) {
//   return (
//     <section>
//       <h2 className="text-lg font-bold text-cvlt-gray-900">Previsione di volo</h2>
//       <p className="mt-1 text-xs text-cvlt-gray-500">
//         Startleiter di Daniele Nerini —{' '}
//         <a href="https://github.com/dnerini/startleiter" target="_blank" rel="noopener noreferrer"
//            className="text-cvlt-blue hover:underline">info</a>
//       </p>
//       {/* ... render forecast days/sites here ... */}
//     </section>
//   )
// }

type SectionState<T> = {
  data: T | null
  loading: boolean
  error: boolean
}

export function VentoClient() {
  const [mch, setMch] = useState<SectionState<StationsResponse>>({ data: null, loading: true, error: false })
  const [others, setOthers] = useState<SectionState<StationsResponse>>({ data: null, loading: true, error: false })
  const [lakes, setLakes] = useState<SectionState<LakesResponse>>({ data: null, loading: true, error: false })
  const [refreshing, setRefreshing] = useState(false)

  const fetchSection = useCallback(async <T,>(
    url: string,
    setter: React.Dispatch<React.SetStateAction<SectionState<T>>>,
  ) => {
    setter((prev) => ({ ...prev, loading: true }))
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setter({ data, loading: false, error: false })
    } catch {
      setter((prev) => ({ ...prev, loading: false, error: true }))
    }
  }, [])

  const fetchAll = useCallback(() => {
    setRefreshing(true)
    Promise.all([
      fetchSection<StationsResponse>('/api/vento/mch', setMch),
      fetchSection<StationsResponse>('/api/vento/others', setOthers),
      fetchSection<LakesResponse>('/api/vento/lakes', setLakes),
    ]).finally(() => setRefreshing(false))
  }, [fetchSection])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const hasAnyData = mch.data || others.data || lakes.data
  const allLoading = mch.loading && others.loading && lakes.loading && !hasAnyData

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cvlt-gray-900">Vento &amp; Meteo</h1>
          <p className="mt-1 text-sm text-cvlt-gray-500">
            Dati in tempo reale per il volo libero nel Sud delle Alpi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-cvlt-gray-200 px-3 py-1.5 text-xs font-medium text-cvlt-gray-600 transition-colors hover:bg-cvlt-gray-50 disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Aggiorna
          </button>
        </div>
      </div>

      {allLoading && (
        <div className="mt-8 space-y-10">
          <SectionSkeleton title="Stazioni MeteoSwiss" />
          <SectionSkeleton title="Altre stazioni" />
        </div>
      )}

      {!allLoading && (
        <div className="mt-8 flex gap-6">
          <div className="min-w-0 flex-1 space-y-10">
            {/* MeteoSwiss stations */}
            {mch.loading && !mch.data ? (
              <SectionSkeleton title="Stazioni MeteoSwiss" />
            ) : mch.error && !mch.data ? (
              <SectionError title="Stazioni MeteoSwiss" />
            ) : mch.data ? (
              <StationsSection
                title="Stazioni MeteoSwiss"
                timestamp={mch.data.timestamp}
                stations={mch.data.stations}
              />
            ) : null}

            {/* Other stations */}
            {others.loading && !others.data ? (
              <SectionSkeleton title="Altre stazioni" />
            ) : others.error && !others.data ? (
              <SectionError title="Altre stazioni" />
            ) : others.data ? (
              <StationsSection
                title="Altre stazioni"
                timestamp={others.data.timestamp}
                stations={others.data.stations}
              />
            ) : null}

            {/* Pressure — static images, no API needed */}
            <PressureSection />

            {/* Forecast — commented out for now */}
            {/* <ForecastSection forecast={[]} /> */}

            {/* Lakes */}
            {lakes.loading && !lakes.data ? (
              <SectionSkeleton title="Laghi" />
            ) : lakes.error && !lakes.data ? (
              <SectionError title="Laghi" />
            ) : lakes.data ? (
              <LakesSection lakes={lakes.data.lakes} />
            ) : null}

            {/* Radiosondaggi */}
            <section>
              <h2 className="text-lg font-bold text-cvlt-gray-900">Radiosondaggi</h2>
              <p className="mt-2 text-sm text-cvlt-gray-600">
                I radiosondaggi di Milano e Payerne sono disponibili su MeteoSvizzera.
              </p>
              <a
                href="https://www.meteosvizzera.admin.ch/home/sistemi-di-rilevamento-e-previsione/atmosfera/radiosondaggi.html"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
              >
                Vai a MeteoSvizzera
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
                </svg>
              </a>
            </section>
          </div>

          <Legend />
        </div>
      )}
    </main>
  )
}
