'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const peakIcon = station.isPeak ? (
    <svg className="h-3.5 w-3.5 flex-shrink-0 text-cvlt-gray-400 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
    </svg>
  ) : (
    <svg className="h-3.5 w-3.5 flex-shrink-0 text-cvlt-gray-300 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="16" width="20" height="2" rx="1" />
    </svg>
  )

  return (
    <div className={`rounded-lg border p-2 transition-shadow hover:shadow-md sm:p-3 ${windLevelBorder(station.windLevel)}`}>
      {/* Mobile: single compact row */}
      <div className="flex items-center gap-2 sm:hidden">
        {peakIcon}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-cvlt-gray-900">{station.name}</span>
        {station.windDir !== null && (
          <span className="text-cvlt-gray-500" title={`${station.windDir}°`}>
            <WindArrow degrees={station.windDir} size={20} />
          </span>
        )}
        <span className={`text-sm font-bold tabular-nums ${windLevelColor(station.windLevel)}`}>
          {station.windAvg !== null ? (
            <>{station.windAvg}<span className="text-[10px] font-normal">-</span>{station.windGust}</>
          ) : '—'}
        </span>
        {station.temp && (
          <span className="text-xs text-cvlt-gray-500">{station.temp}</span>
        )}
      </div>

      {/* Desktop: original two-row layout */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {peakIcon}
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
      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:mt-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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

type PressurePoint = {
  time: string
  diffP: number | null
  diffT: number | null
  windMTR: number | null
}

type FoehnPoint = {
  time: string
  diffP: number
}

function PressureChart({ data }: { data: PressurePoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    function draw() {
      const ctx = canvas!.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas!.getBoundingClientRect()
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height

      const pad = { top: 10, right: 70, bottom: 25, left: 40 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    // Compute ranges
    const pressures = data.map(d => d.diffP).filter((v): v is number => v !== null)
    const temps = data.map(d => d.diffT).filter((v): v is number => v !== null)
    const winds = data.map(d => d.windMTR).filter((v): v is number => v !== null)
    const times = data.map(d => new Date(d.time).getTime())

    const tMin = Math.min(...times)
    const tMax = Math.max(...times)
    const pMin = Math.min(...pressures, 0)
    const pMax = Math.max(...pressures, 0)
    const pRange = Math.max(Math.abs(pMin), Math.abs(pMax), 2)
    const tempMin = Math.min(...temps, 0)
    const tempMax = Math.max(...temps, 0)
    const wMax = winds.length > 0 ? Math.max(...winds, 10) : 10

    const xScale = (t: number) => pad.left + ((t - tMin) / (tMax - tMin)) * cW
    const yP = (v: number) => pad.top + cH / 2 - (v / pRange) * (cH / 2)
    const yT = (v: number) => {
      const tRange = Math.max(Math.abs(tempMin), Math.abs(tempMax), 2)
      return pad.top + cH / 2 - (v / tRange) * (cH / 2)
    }
    const yW = (v: number) => pad.top + cH - (v / wMax) * cH

    // Background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    const pStep = pRange > 8 ? 2 : 1
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5
    // Zero line
    ctx.beginPath()
    ctx.moveTo(pad.left, yP(0))
    ctx.lineTo(W - pad.right, yP(0))
    ctx.stroke()
    // Horizontal grid — matches y-axis tick marks
    for (let v = -Math.ceil(pRange); v <= Math.ceil(pRange); v += pStep) {
      if (v !== 0 && Math.abs(v) <= pRange) {
        ctx.beginPath()
        ctx.setLineDash([3, 3])
        ctx.moveTo(pad.left, yP(v))
        ctx.lineTo(W - pad.right, yP(v))
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Time labels on x-axis
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    const dayMs = 24 * 60 * 60 * 1000
    const totalDays = (tMax - tMin) / dayMs
    const pxPerDay = cW / totalDays
    const dayStep = pxPerDay < 40 ? 2 : 1
    const startDay = new Date(tMin)
    startDay.setHours(0, 0, 0, 0)
    let dayIdx = 0
    for (let d = startDay.getTime(); d <= tMax; d += dayMs) {
      if (d >= tMin) {
        const x = xScale(d)
        // Grid line always
        ctx.strokeStyle = '#f3f4f6'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(x, pad.top)
        ctx.lineTo(x, pad.top + cH)
        ctx.stroke()
        // Label only every dayStep
        if (dayIdx % dayStep === 0) {
          ctx.fillStyle = '#6b7280'
          ctx.fillText(new Date(d).toLocaleDateString('it-CH', { day: 'numeric', month: 'short' }), x, H - pad.bottom + 15)
        }
        dayIdx++
      }
    }

    // Y-axis labels (pressure) — dynamic range with step of 1
    ctx.textAlign = 'right'
    ctx.fillStyle = '#3b82f6'
    for (let v = -Math.ceil(pRange); v <= Math.ceil(pRange); v += pStep) {
      if (Math.abs(v) <= pRange) {
        ctx.fillText(`${v}`, pad.left - 5, yP(v) + 3)
      }
    }
    // Pressure bars
    const barWidth = Math.max(1, (cW / data.length) * 0.7)
    const zeroY = yP(0)
    for (const point of data) {
      if (point.diffP === null) continue
      const x = xScale(new Date(point.time).getTime())
      const y = yP(point.diffP)
      const barH = zeroY - y

      if (point.diffP <= -4) ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'
      else if (point.diffP <= -3) ctx.fillStyle = 'rgba(249, 115, 22, 0.7)'
      else if (point.diffP <= -2) ctx.fillStyle = 'rgba(234, 179, 8, 0.7)'
      else ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'

      ctx.fillRect(x - barWidth / 2, Math.min(y, zeroY), barWidth, Math.abs(barH))
    }

    // Temperature line
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    let started = false
    for (const point of data) {
      if (point.diffT === null) continue
      const x = xScale(new Date(point.time).getTime())
      const y = yT(point.diffT)
      if (!started) { ctx.moveTo(x, y); started = true }
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Wind MTR area
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const windPoints: { x: number; y: number }[] = []
    for (const point of data) {
      if (point.windMTR === null) continue
      const x = xScale(new Date(point.time).getTime())
      const y = yW(point.windMTR)
      windPoints.push({ x, y })
    }
    if (windPoints.length > 0) {
      ctx.moveTo(windPoints[0].x, yW(0))
      for (const p of windPoints) ctx.lineTo(p.x, p.y)
      ctx.lineTo(windPoints[windPoints.length - 1].x, yW(0))
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(windPoints[0].x, windPoints[0].y)
      for (let i = 1; i < windPoints.length; i++) ctx.lineTo(windPoints[i].x, windPoints[i].y)
      ctx.stroke()
    }

    // Right axis labels (temp) — tick marks with values
    ctx.textAlign = 'left'
    ctx.fillStyle = '#1e293b'
    ctx.font = '10px system-ui, sans-serif'
    const tRange = Math.max(Math.abs(tempMin), Math.abs(tempMax), 2)
    const tStep = tRange > 8 ? 2 : 1
    for (let v = -Math.ceil(tRange); v <= Math.ceil(tRange); v += tStep) {
      if (Math.abs(v) <= tRange) {
        ctx.fillText(`${v}`, W - pad.right + 5, yT(v) + 3)
      }
    }
    // Right axis labels (wind) — tick marks with values
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'
    ctx.font = '10px system-ui, sans-serif'
    for (let v = 0; v <= wMax; v += 5) {
      const wy = yW(v)
      if (wy >= pad.top && wy <= pad.top + cH) {
        ctx.fillText(`${v}`, W - pad.right + 35, wy + 3)
      }
    }
    // (Legend moved to sidebar)
    } // end draw()
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      className="h-64 w-full rounded-lg border border-cvlt-gray-200 sm:h-80"
      style={{ width: '100%' }}
    />
  )
}

function FoehnChart({ data }: { data: FoehnPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    function draw() {
      const ctx = canvas!.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas!.getBoundingClientRect()
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height

      const pad = { top: 10, right: 30, bottom: 25, left: 40 }
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    const pressures = data.map(d => d.diffP)
    const times = data.map(d => new Date(d.time).getTime())

    const tMin = Math.min(...times)
    const tMax = Math.max(...times)
    const pMin = Math.min(...pressures, -4)
    const pMax = Math.max(...pressures, 4)
    const pRange = Math.max(Math.abs(pMin), Math.abs(pMax), 4)

    const xScale = (t: number) => pad.left + ((t - tMin) / (tMax - tMin)) * cW
    const yP = (v: number) => pad.top + cH / 2 - (v / pRange) * (cH / 2)

    // Background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)

    // Threshold zones
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)'
    ctx.fillRect(pad.left, yP(pRange), cW, yP(4) - yP(pRange))
    ctx.fillRect(pad.left, yP(-4), cW, yP(-pRange) - yP(-4))

    // Grid + labels
    ctx.font = '10px system-ui, sans-serif'
    const pStep = pRange > 10 ? 2 : 1
    // Zero line
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad.left, yP(0))
    ctx.lineTo(W - pad.right, yP(0))
    ctx.stroke()
    // Other grid lines
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5
    ctx.textAlign = 'right'
    ctx.fillStyle = '#6b7280'
    for (let v = -Math.ceil(pRange); v <= Math.ceil(pRange); v += pStep) {
      if (Math.abs(v) <= pRange) {
        ctx.fillText(`${v}`, pad.left - 5, yP(v) + 3)
        if (v !== 0) {
          ctx.beginPath()
          ctx.setLineDash([3, 3])
          ctx.moveTo(pad.left, yP(v))
          ctx.lineTo(W - pad.right, yP(v))
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    }

    // ±4 threshold lines
    ctx.strokeStyle = '#93c5fd'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(pad.left, yP(4))
    ctx.lineTo(W - pad.right, yP(4))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pad.left, yP(-4))
    ctx.lineTo(W - pad.right, yP(-4))
    ctx.stroke()
    ctx.setLineDash([])

    // Föhn labels at thresholds
    ctx.fillStyle = '#3b82f6'
    ctx.font = '9px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('SÜD FÖHN', W - pad.right - 55, yP(pRange) + 12)
    ctx.fillText('NORD FÖHN', W - pad.right - 60, yP(-pRange) - 4)

    // Time labels on x-axis
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    const dayMs = 24 * 60 * 60 * 1000
    const totalDays = (tMax - tMin) / dayMs
    const pxPerDay = cW / totalDays
    const dayStep = pxPerDay < 35 ? 2 : 1
    const useShort = pxPerDay < 55
    const startDay = new Date(tMin)
    startDay.setHours(0, 0, 0, 0)
    let dayIdx = 0
    for (let d = startDay.getTime() + dayMs; d <= tMax; d += dayMs) {
      const x = xScale(d)
      // Grid line always
      ctx.strokeStyle = '#f3f4f6'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, pad.top + cH)
      ctx.stroke()
      // Label only every dayStep
      if (dayIdx % dayStep === 0) {
        ctx.fillStyle = '#6b7280'
        const label = useShort
          ? new Date(d).toLocaleDateString('it-CH', { day: 'numeric', month: 'short' })
          : new Date(d).toLocaleDateString('it-CH', { weekday: 'short', day: 'numeric', month: 'short' })
        ctx.fillText(label, x, H - pad.bottom + 15)
      }
      dayIdx++
    }

    // "Now" marker
    const now = Date.now()
    if (now >= tMin && now <= tMax) {
      const xNow = xScale(now)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(xNow, pad.top)
      ctx.lineTo(xNow, pad.top + cH)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'
      ctx.font = '9px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('ora', xNow, pad.top - 2)
    }

    // Pressure line
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false
    for (const point of data) {
      const x = xScale(new Date(point.time).getTime())
      const y = yP(point.diffP)
      if (!started) { ctx.moveTo(x, y); started = true }
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Fill below line
    ctx.lineTo(xScale(new Date(data[data.length - 1].time).getTime()), yP(0))
    ctx.lineTo(xScale(new Date(data[0].time).getTime()), yP(0))
    ctx.closePath()
    ctx.fillStyle = 'rgba(30, 64, 175, 0.08)'
    ctx.fill()
    } // end draw()
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      className="h-64 w-full rounded-lg border border-cvlt-gray-200 sm:h-80"
      style={{ width: '100%' }}
    />
  )
}

function PressureSection({ data, loading, error, foehnData, foehnLoading, foehnError }: {
  data: PressurePoint[] | null; loading: boolean; error: boolean
  foehnData: FoehnPoint[] | null; foehnLoading: boolean; foehnError: boolean
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-cvlt-gray-900">Pressione</h2>
      <div className="mt-3 space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-medium text-cvlt-gray-600">
            Dati misurati: Magadino–Kloten (MAG-KLO) e Vento Matro
          </h3>
          <p className="mb-2 text-xs text-cvlt-gray-400">Ultimi 7 giorni — dati orari MeteoSwiss</p>
          {loading && !data ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-cvlt-gray-200 bg-cvlt-gray-50">
              <span className="text-sm text-cvlt-gray-400 animate-pulse">Caricamento dati pressione...</span>
            </div>
          ) : error && !data ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-cvlt-gray-200 bg-cvlt-gray-50">
              <span className="text-sm text-cvlt-gray-400">Dati pressione non disponibili.</span>
            </div>
          ) : data && data.length > 0 ? (
            <PressureChart data={data} />
          ) : null}
        </div>
        <div>
          <h3 className="mb-1 text-sm font-medium text-cvlt-gray-600">
            Previsione föhn: Lugano–Zürich
          </h3>
          <p className="mb-2 text-xs text-cvlt-gray-400">Prossimi ~10 giorni — prognosi MOSMIX (DWD)</p>
          {foehnLoading && !foehnData ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-cvlt-gray-200 bg-cvlt-gray-50">
              <span className="text-sm text-cvlt-gray-400 animate-pulse">Caricamento previsione föhn...</span>
            </div>
          ) : foehnError && !foehnData ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-cvlt-gray-200 bg-cvlt-gray-50">
              <span className="text-sm text-cvlt-gray-400">Previsione föhn non disponibile.</span>
            </div>
          ) : foehnData && foehnData.length > 0 ? (
            <FoehnChart data={foehnData} />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function WindLegend() {
  return (
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
  )
}

function PressureLegend() {
  return (
    <div className="space-y-2.5 text-xs text-cvlt-gray-600">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-4 flex-shrink-0 rounded-sm bg-blue-400/40" />
        Δ Pressione (hPa)
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-4 flex-shrink-0 bg-gray-800" />
        Δ Temperatura (°C)
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-4 flex-shrink-0 rounded-sm bg-green-500/20 border border-green-500/40" />
        Vento Matro (km/h)
      </div>
      <div className="border-t border-cvlt-gray-200 pt-2 mt-1">
        <p className="font-medium text-cvlt-gray-500 mb-1.5">Colori barre:</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-4 flex-shrink-0 rounded-sm bg-blue-400/40" />
            &gt; -2 hPa
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-4 flex-shrink-0 rounded-sm bg-yellow-500/70" />
            <span className="text-yellow-600">≤ -2 hPa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-4 flex-shrink-0 rounded-sm bg-orange-500/70" />
            <span className="text-orange-500">≤ -3 hPa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-4 flex-shrink-0 rounded-sm bg-red-500/70" />
            <span className="text-red-500">≤ -4 hPa</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const PRESSURE_SECTIONS = ['pressione']

function Legend() {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const sectionIds = ['stazioni-meteoswiss', 'altre-stazioni', 'pressione', 'laghi', 'radiosondaggi']
    const handleScroll = () => {
      const navHeight = 80
      let current = ''
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= navHeight + 10) {
          current = id
        }
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const showPressure = PRESSURE_SECTIONS.includes(activeSection)

  return (
    <aside className="hidden flex-shrink-0 lg:block lg:w-44">
      <div className="sticky top-20 space-y-3 rounded-lg border border-cvlt-gray-200 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-cvlt-gray-400">
          Legenda
        </h3>
        {showPressure ? <PressureLegend /> : <WindLegend />}
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
  const [pressure, setPressure] = useState<SectionState<{ data: PressurePoint[] }>>({ data: null, loading: true, error: false })
  const [foehn, setFoehn] = useState<SectionState<{ data: FoehnPoint[] }>>({ data: null, loading: true, error: false })
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
      fetchSection<{ data: PressurePoint[] }>('/api/vento/pressure', setPressure),
      fetchSection<{ data: FoehnPoint[] }>('/api/vento/foehn', setFoehn),
    ]).finally(() => setRefreshing(false))
  }, [fetchSection])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const hasAnyData = mch.data || others.data || lakes.data || pressure.data || foehn.data
  const allLoading = mch.loading && others.loading && lakes.loading && pressure.loading && foehn.loading && !hasAnyData

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cvlt-gray-900 sm:text-3xl">Vento &amp; Meteo</h1>
          <p className="mt-0.5 text-xs text-cvlt-gray-500 sm:mt-1 sm:text-sm">
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
        <div className="mt-4 flex gap-6 sm:mt-8">
          <div className="min-w-0 flex-1 space-y-6 sm:space-y-10">
            {/* MeteoSwiss stations */}
            <div id="stazioni-meteoswiss">
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
            </div>

            {/* Other stations */}
            <div id="altre-stazioni">
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
            </div>

            {/* Pressure */}
            <div id="pressione">
              <PressureSection
                data={pressure.data?.data ?? null}
                loading={pressure.loading}
                error={pressure.error}
                foehnData={foehn.data?.data ?? null}
                foehnLoading={foehn.loading}
                foehnError={foehn.error}
              />
            </div>

            {/* Forecast — commented out for now */}
            {/* <ForecastSection forecast={[]} /> */}

            {/* Lakes */}
            <div id="laghi">
              {lakes.loading && !lakes.data ? (
                <SectionSkeleton title="Laghi" />
              ) : lakes.error && !lakes.data ? (
                <SectionError title="Laghi" />
              ) : lakes.data ? (
                <LakesSection lakes={lakes.data.lakes} />
              ) : null}
            </div>

            {/* Radiosondaggi */}
            <section id="radiosondaggi">
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
