'use client'

import { useState } from 'react'
import Link from 'next/link'

type RelatedNews = { title: string; slug: string }

type Event = {
  id: string
  slug: string
  title: string
  startDate: string
  endDate?: string | null
  backupStartDate?: string | null
  backupEndDate?: string | null
  location?: string | null
  status: 'confirmed' | 'tentative' | 'cancelled'
  externalLink?: string | null
  useBackupDate: boolean
  relatedNews: RelatedNews[]
}

type EventBar = {
  event: Event
  startCol: number
  endCol: number
  isBackup: boolean
  continuesLeft: boolean
  continuesRight: boolean
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

const barColors = {
  confirmed: 'bg-cvlt-blue/15 text-cvlt-blue-dark',
  tentative: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700 line-through opacity-60',
}

const barColorsBackup = {
  confirmed: 'border border-dashed border-cvlt-blue/40 text-cvlt-blue/70',
  tentative: 'border border-dashed border-amber-300 text-amber-600',
  cancelled: 'border border-dashed border-red-300 text-red-500 line-through opacity-60',
}

const statusDot = {
  confirmed: 'bg-cvlt-blue',
  tentative: 'bg-amber-400',
  cancelled: 'bg-red-400',
}

function EventDetail({ event, onClose }: { event: Event; onClose: () => void }) {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusDot[event.status]}`} />
            <h3 className="text-lg font-semibold">{event.title}</h3>
          </div>
          {event.status === 'cancelled' && (
            <span className="text-sm font-medium text-red-600">Annullato</span>
          )}
          {event.status === 'tentative' && (
            <span className="text-sm font-medium text-amber-600">Provvisorio</span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-gray-500">
            {event.useBackupDate ? 'Data originale:' : 'Data:'}
          </dt>
          <dd className={event.useBackupDate ? 'text-gray-400 line-through' : ''}>
            {new Date(event.startDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}
            {event.endDate && (
              <> &mdash; {new Date(event.endDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}</>
            )}
          </dd>
        </div>
        {event.backupStartDate && (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">
              {event.useBackupDate ? 'Nuova data:' : 'Data di riserva:'}
            </dt>
            <dd className={event.useBackupDate ? 'font-medium text-cvlt-gray-900' : ''}>
              {new Date(event.backupStartDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}
              {event.backupEndDate && (
                <> &mdash; {new Date(event.backupEndDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}</>
              )}
            </dd>
          </div>
        )}
        {event.location && (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Luogo:</dt>
            <dd>{event.location}</dd>
          </div>
        )}
        {event.externalLink && (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Link:</dt>
            <dd>
              <a href={event.externalLink} target="_blank" rel="noopener noreferrer" className="text-cvlt-blue hover:underline">
                {event.externalLink}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <Link
          href={`/calendario/${event.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
        >
          Pagina evento &rarr;
        </Link>
      </div>

      {event.relatedNews.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notizie collegate</h4>
          <ul className="mt-2 space-y-1">
            {event.relatedNews.map((news) => (
              <li key={news.slug}>
                <Link href={`/notizie/${news.slug}`} className="text-sm text-cvlt-blue hover:underline">
                  {news.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function CalendarGrid({ events }: { events: Event[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  type Cell = { day: number; currentMonth: boolean }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  // Build cells with leading/trailing days from adjacent months
  const cells: Cell[] = []

  // Leading days from previous month
  const prevMonthDays = getDaysInMonth(
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1,
  )
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, currentMonth: false })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true })
  }

  // Trailing days from next month
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, currentMonth: false })
  }

  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedEvent(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedEvent(null)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedEvent(null)
  }

  function selectEvent(event: Event) {
    setSelectedEvent(selectedEvent?.id === event.id ? null : event)
  }

  // Get actual Date for a cell (handles adjacent months)
  function cellDate(cell: Cell): Date {
    if (cell.currentMonth) return new Date(year, month, cell.day)
    // Leading days: previous month
    // Trailing days: next month
    // Determine by position - but simpler: use the day number relative to current month
    // Leading: day > 15 means previous month, Trailing: day < 15 means next month
    if (cell.day > 15) {
      // Previous month
      return new Date(year, month - 1, cell.day)
    }
    // Next month
    return new Date(year, month + 1, cell.day)
  }

  // Compute an event bar for a given date range within a week
  function computeBar(
    startDateStr: string,
    endDateStr: string | null | undefined,
    week: Cell[],
  ): { startCol: number; endCol: number; continuesLeft: boolean; continuesRight: boolean } | null {
    const eStart = new Date(startDateStr)
    eStart.setHours(0, 0, 0, 0)
    const eEnd = endDateStr ? new Date(endDateStr) : new Date(startDateStr)
    eEnd.setHours(23, 59, 59, 999)

    let startCol = -1
    let endCol = -1

    for (let i = 0; i < 7; i++) {
      const d = cellDate(week[i])
      if (d >= eStart && d <= eEnd) {
        if (startCol === -1) startCol = i
        endCol = i
      }
    }

    if (startCol === -1) return null

    const wkFirst = cellDate(week[0])
    const wkLast = cellDate(week[6])
    wkLast.setHours(23, 59, 59, 999)

    return {
      startCol,
      endCol,
      continuesLeft: eStart < wkFirst,
      continuesRight: eEnd > wkLast,
    }
  }

  // Get all bars for a week (main dates + backup dates)
  // When useBackupDate is true, only show backup dates (as solid bars)
  function getWeekBars(week: Cell[]): EventBar[] {
    const bars: EventBar[] = []
    for (const event of events) {
      if (event.useBackupDate) {
        // Switched to backup: show backup dates as main (solid) bars
        if (event.backupStartDate) {
          const backupBar = computeBar(event.backupStartDate, event.backupEndDate, week)
          if (backupBar) {
            bars.push({ event, ...backupBar, isBackup: false })
          }
        }
      } else {
        // Normal: show main dates + backup dates (dashed)
        const mainBar = computeBar(event.startDate, event.endDate, week)
        if (mainBar) {
          bars.push({ event, ...mainBar, isBackup: false })
        }
        if (event.backupStartDate) {
          const backupBar = computeBar(event.backupStartDate, event.backupEndDate, week)
          if (backupBar) {
            bars.push({ event, ...backupBar, isBackup: true })
          }
        }
      }
    }
    return bars
  }

  // Assign bars to lanes (rows) to avoid horizontal overlaps
  function assignLanes(bars: EventBar[]): EventBar[][] {
    const sorted = [...bars].sort((a, b) => {
      if (a.startCol !== b.startCol) return a.startCol - b.startCol
      return (b.endCol - b.startCol) - (a.endCol - a.startCol) // wider first
    })
    const lanes: EventBar[][] = []
    for (const bar of sorted) {
      let placed = false
      for (const lane of lanes) {
        const fits = lane.every(b => b.endCol < bar.startCol || b.startCol > bar.endCol)
        if (fits) {
          lane.push(bar)
          placed = true
          break
        }
      }
      if (!placed) {
        lanes.push([bar])
      }
    }
    return lanes
  }

  function getEventsForCell(cell: Cell): Event[] {
    const date = cellDate(cell)
    return events.filter((e) => {
      // Check main date range (or backup if useBackupDate)
      const startStr = e.useBackupDate && e.backupStartDate ? e.backupStartDate : e.startDate
      const endStr = e.useBackupDate && e.backupStartDate
        ? (e.backupEndDate || e.backupStartDate)
        : (e.endDate || e.startDate)
      const start = new Date(startStr)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endStr)
      end.setHours(23, 59, 59, 999)
      if (date >= start && date <= end) return true

      // Also check backup date range (shown as dashed bar when useBackupDate is false)
      if (!e.useBackupDate && e.backupStartDate) {
        const bStart = new Date(e.backupStartDate)
        bStart.setHours(0, 0, 0, 0)
        const bEnd = new Date(e.backupEndDate || e.backupStartDate)
        bEnd.setHours(23, 59, 59, 999)
        if (date >= bStart && date <= bEnd) return true
      }

      return false
    })
  }

  function handleDayClick(cell: Cell) {
    const dayEvents = getEventsForCell(cell)
    if (dayEvents.length === 1) {
      selectEvent(dayEvents[0])
    } else if (dayEvents.length > 1) {
      const next = dayEvents.find((e) => e.id !== selectedEvent?.id) || dayEvents[0]
      selectEvent(next)
    }
  }

  function getBarRounding(bar: EventBar) {
    if (bar.continuesLeft && bar.continuesRight) return ''
    if (bar.continuesLeft) return 'rounded-r'
    if (bar.continuesRight) return 'rounded-l'
    return 'rounded'
  }

  return (
    <div>
      {/* Calendar + Legend sidebar */}
      <div className="flex gap-6">
      {/* Calendar column */}
      <div className="min-w-0 flex-1">
        {/* Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={goToday}
              className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Oggi
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">
              ←
            </button>
            <button onClick={nextMonth} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">
              →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {DAYS.map((d) => (
            <div key={d} className="border-b border-r border-gray-200 px-2 py-2 text-center text-xs font-semibold text-gray-500 last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIdx) => {
          const bars = getWeekBars(week)
          const lanes = assignLanes(bars)

          return (
            <div key={weekIdx} className={weekIdx < weeks.length - 1 ? 'border-b border-gray-200' : ''}>
              {/* Day numbers */}
              <div className="grid grid-cols-7">
                {week.map((cell, colIdx) => {
                  const isToday = cell.currentMonth && isSameDay(new Date(year, month, cell.day), today)
                  const hasEvents = getEventsForCell(cell).length > 0
                  return (
                    <div
                      key={colIdx}
                      onClick={() => handleDayClick(cell)}
                      className={`border-r border-gray-100 px-1.5 pt-1 last:border-r-0 ${!cell.currentMonth ? 'bg-gray-50/50' : ''} ${isToday ? 'bg-blue-50/50' : ''} ${hasEvents ? 'cursor-pointer' : ''}`}
                      role={hasEvents ? 'button' : undefined}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center text-xs ${isToday ? 'rounded-full bg-cvlt-blue font-bold text-white' : cell.currentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                        {cell.day}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Event bar lanes */}
              <div className="min-h-[40px] pb-1">
                {lanes.map((lane, laneIdx) => (
                  <div key={laneIdx} className="grid grid-cols-7">
                    {lane.map((bar) => {
                      const colors = bar.isBackup ? barColorsBackup[bar.event.status] : barColors[bar.event.status]
                      const rounding = getBarRounding(bar)
                      const isSelected = selectedEvent?.id === bar.event.id

                      return (
                        <div
                          key={`${bar.event.id}-${bar.isBackup ? 'b' : 'm'}`}
                          style={{ gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}` }}
                          onClick={() => selectEvent(bar.event)}
                          className={`mx-0.5 mb-0.5 cursor-pointer truncate px-1.5 py-0.5 text-[11px] font-medium leading-tight ${colors} ${rounding} ${isSelected ? 'ring-2 ring-cvlt-blue ring-offset-1' : ''}`}
                        >
                          {bar.isBackup ? `↻ ${bar.event.title}` : bar.event.title}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        </div>
      </div>{/* end calendar column */}

      {/* Legend sidebar - hidden on mobile, shown on desktop */}
      <aside className="hidden flex-shrink-0 lg:block lg:w-40">
        <div className="sticky top-20 space-y-3 rounded-lg border border-gray-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Legenda</h3>
          <div className="space-y-2.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-cvlt-blue" />
              Confermato
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-400" />
              Provvisorio
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-400" />
              Annullato
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-5 flex-shrink-0 rounded border border-dashed border-gray-400" />
              Data di riserva
            </div>
          </div>
        </div>
      </aside>
      </div>{/* end flex wrapper */}

      {/* Event Detail */}
      {selectedEvent && (
        <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* Upcoming list below calendar */}
      <div className="mt-8">
        <h3 className="text-lg font-bold">Prossimi eventi</h3>
        {(() => {
          const upcoming = events
            .filter((e) => new Date(e.startDate) >= today && e.status !== 'cancelled')
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 10)

          if (upcoming.length === 0) {
            return <p className="mt-3 text-gray-500">Nessun evento in programma.</p>
          }

          return (
            <ul className="mt-3 space-y-3">
              {upcoming.map((e) => (
                <li
                  key={e.id}
                  onClick={() => selectEvent(e)}
                  className={`flex cursor-pointer items-center gap-4 rounded border px-4 py-3 transition-colors hover:bg-gray-50 ${selectedEvent?.id === e.id ? 'border-cvlt-blue/30 bg-blue-50/50' : 'border-gray-100'}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusDot[e.status]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(e.startDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long' })}
                      {e.endDate && (
                        <> &mdash; {new Date(e.endDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long' })}</>
                      )}
                      {e.location && <> · {e.location}</>}
                    </div>
                  </div>
                  {e.status === 'tentative' && (
                    <span className="flex-shrink-0 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Provvisorio</span>
                  )}
                </li>
              ))}
            </ul>
          )
        })()}
      </div>
    </div>
  )
}
