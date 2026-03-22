'use client'

import { useState } from 'react'
import Link from 'next/link'

type RelatedNews = { title: string; slug: string }

type Event = {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  backupStartDate?: string | null
  backupEndDate?: string | null
  location?: string | null
  status: 'confirmed' | 'tentative' | 'cancelled'
  externalLink?: string | null
  relatedNews: RelatedNews[]
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isInRange(date: Date, start: Date, end: Date | null) {
  if (!end) return isSameDay(date, start)
  return date >= start && date <= end
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

const statusColors = {
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  tentative: 'bg-amber-50 text-amber-800 border-amber-200',
  cancelled: 'bg-red-50 text-red-800 border-red-200 line-through',
}

const statusDot = {
  confirmed: 'bg-blue-500',
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
          <dt className="font-medium text-gray-500">Data:</dt>
          <dd>
            {new Date(event.startDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}
            {event.endDate && (
              <> — {new Date(event.endDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}</>
            )}
          </dd>
        </div>
        {event.backupStartDate && (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Data di riserva:</dt>
            <dd>
              {new Date(event.backupStartDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}
              {event.backupEndDate && (
                <> — {new Date(event.backupEndDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}</>
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
              <a href={event.externalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {event.externalLink}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <Link
          href={`/calendario/${event.id}`}
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

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

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

  function getEventsForDay(day: number): Event[] {
    const date = new Date(year, month, day)
    return events.filter((e) => {
      const start = new Date(e.startDate)
      const end = e.endDate ? new Date(e.endDate) : null
      return isInRange(date, start, end)
    })
  }

  function handleDayClick(day: number) {
    const dayEvents = getEventsForDay(day)
    if (dayEvents.length === 1) {
      selectEvent(dayEvents[0])
    } else if (dayEvents.length > 1) {
      // If multiple events, select the first one not already selected
      const next = dayEvents.find((e) => e.id !== selectedEvent?.id) || dayEvents[0]
      selectEvent(next)
    }
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
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
        <div className="grid grid-cols-7 bg-gray-50">
          {DAYS.map((d) => (
            <div key={d} className="border-b border-gray-200 px-2 py-2 text-center text-xs font-semibold text-gray-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-100 bg-gray-50/50" />
            }

            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(new Date(year, month, day), today)
            const hasEvents = dayEvents.length > 0

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[80px] border-b border-r border-gray-100 p-1 ${isToday ? 'bg-blue-50/50' : ''} ${hasEvents ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                <div className={`mb-1 flex h-6 w-6 items-center justify-center text-xs ${isToday ? 'rounded-full bg-blue-600 font-bold text-white' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className={`w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium leading-tight ${statusColors[e.status]} ${selectedEvent?.id === e.id ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
                  className={`flex cursor-pointer items-center gap-4 rounded border px-4 py-3 transition-colors hover:bg-gray-50 ${selectedEvent?.id === e.id ? 'border-blue-300 bg-blue-50/50' : 'border-gray-100'}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusDot[e.status]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(e.startDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long' })}
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
