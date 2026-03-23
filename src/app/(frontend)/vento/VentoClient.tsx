'use client'

import { useState, useEffect, useCallback } from 'react'
import type { VentoData, WindStation, ForecastDay, LakeLevel } from '../api/vento/route'

function WindArrow({ degrees, size = 20 }: { degrees: number; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${degrees}deg)` }}
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

function flyabilityColor(level: 'good' | 'moderate' | 'poor') {
  switch (level) {
    case 'good': return 'text-green-700 bg-green-100'
    case 'moderate': return 'text-amber-700 bg-amber-100'
    case 'poor': return 'text-red-700 bg-red-100'
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
        {/* Wind direction + speed */}
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

        {/* Temp */}
        {station.temp && (
          <span className="text-sm text-cvlt-gray-600">{station.temp}</span>
        )}

        {/* Cloud base */}
        {station.cloudBase && (
          <span className="text-xs text-green-700">{station.cloudBase}</span>
        )}
      </div>

      {station.graphUrl && (
        <a
          href={station.graphUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-cvlt-blue hover:underline"
        >
          Grafico
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
          </svg>
        </a>
      )}
    </div>
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

function ForecastSection({ forecast }: { forecast: ForecastDay[] }) {
  if (forecast.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-cvlt-gray-900">Previsione di volo</h2>
      <p className="mt-1 text-xs text-cvlt-gray-500">
        Startleiter di Daniele Nerini —{' '}
        <a href="https://github.com/dnerini/startleiter" target="_blank" rel="noopener noreferrer" className="text-cvlt-blue hover:underline">
          info
        </a>
      </p>
      <div className="mt-4 space-y-6">
        {forecast.map((day) => (
          <div key={day.date}>
            <h3 className="text-sm font-semibold text-cvlt-gray-700">
              {new Date(day.date + 'T12:00:00').toLocaleDateString('it-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {day.sites.map((site) => (
                <div key={site.name} className="flex items-center justify-between rounded-lg border border-cvlt-gray-200 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-cvlt-gray-900">{site.name}</span>
                    <div className="mt-0.5 flex gap-3 text-xs text-cvlt-gray-500">
                      <span>TOP {site.top}</span>
                      <span>{site.distance}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums ${flyabilityColor(site.level)}`}>
                      {site.flyability}%
                    </span>
                    {site.graphUrl && (
                      <a href={site.graphUrl} target="_blank" rel="noopener noreferrer" title="Grafico dettagliato">
                        <svg className="h-4 w-4 text-cvlt-gray-400 hover:text-cvlt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
                <td className="py-2 pr-4">
                  <span className="font-medium text-cvlt-gray-900">{lake.name}</span>
                  {lake.location && <span className="ml-1 text-cvlt-gray-400">({lake.location})</span>}
                </td>
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

function PressureSection({ images }: { images: VentoData['images'] }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-cvlt-gray-900">Pressione</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-cvlt-gray-600">Pressione attuale</h3>
          <img
            src={images.pressure}
            alt="Pressione attuale"
            className="w-full rounded-lg border border-cvlt-gray-200"
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-cvlt-gray-600">Diagramma del föhn</h3>
          <img
            src={images.foehn}
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-cvlt-gray-500">
      <span className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 text-cvlt-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
        </svg>
        Vetta
      </span>
      <span className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 text-cvlt-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="16" width="20" height="2" rx="1" />
        </svg>
        Fondovalle
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full border border-red-300 bg-red-50" />
        <span className="text-red-600">&gt;15 km/h</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full border border-amber-200 bg-amber-50" />
        <span className="text-amber-600">5–15 km/h</span>
      </span>
      <span>Velocità media – raffica</span>
    </div>
  )
}

export function VentoClient() {
  const [data, setData] = useState<VentoData | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vento')
      if (!res.ok) throw new Error()
      setData(await res.json())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cvlt-gray-900">Vento &amp; Meteo</h1>
          <p className="mt-1 text-sm text-cvlt-gray-500">
            Dati in tempo reale per il volo libero nel Sud delle Alpi.
            Fonte:{' '}
            <a href="https://vento.cvlt.ch" target="_blank" rel="noopener noreferrer" className="text-cvlt-blue hover:underline">
              vento.cvlt.ch
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.fetchedAt && (
            <span className="text-xs text-cvlt-gray-400">
              {new Date(data.fetchedAt).toLocaleTimeString('it-CH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-cvlt-gray-200 px-3 py-1.5 text-xs font-medium text-cvlt-gray-600 transition-colors hover:bg-cvlt-gray-50 disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Aggiorna
          </button>
        </div>
      </div>

      {error && !data && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Impossibile caricare i dati meteo. Prova a ricaricare la pagina o visita{' '}
          <a href="https://vento.cvlt.ch" target="_blank" rel="noopener noreferrer" className="font-medium underline">
            vento.cvlt.ch
          </a> direttamente.
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-10">
          <Legend />
          <ForecastSection forecast={data.forecast} />
          <StationsSection title="Stazioni MeteoSwiss" timestamp={data.mch.timestamp} stations={data.mch.stations} />
          <StationsSection title="Altre stazioni" timestamp={data.others.timestamp} stations={data.others.stations} />
          <PressureSection images={data.images} />
          <LakesSection lakes={data.lakes} />

          {/* Radiosondaggi link */}
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

          {/* Quick links */}
          <section>
            <h2 className="text-lg font-bold text-cvlt-gray-900">Link rapidi</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: 'DABS', href: 'https://www.skybriefing.com/it/dabs' },
                { label: 'XContest Ticino Sud', href: 'https://www.xcontest.org/world/en/flights-search/?list[sort]=time_start&filter[point]=8.99918+46.12722&filter[radius]=30000&filter[mode]=START' },
                { label: 'XContest Ticino Nord', href: 'https://www.xcontest.org/world/en/flights-search/?list[sort]=time_start&filter[point]=8.79333+46.45913&filter[radius]=25000&filter[mode]=START' },
                { label: 'ATIS Locarno', href: 'tel:+41918161744' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('tel:') ? undefined : '_blank'}
                  rel={link.href.startsWith('tel:') ? undefined : 'noopener noreferrer'}
                  className="rounded-full border border-cvlt-gray-200 px-3 py-1.5 text-xs font-medium text-cvlt-gray-700 transition-colors hover:border-cvlt-blue hover:text-cvlt-blue"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
