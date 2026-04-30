import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerUrl } from '@/lib/env'

export const dynamic = 'force-dynamic'

function formatDate(date: string): string {
  // Convert to YYYYMMDD (all-day event format)
  return new Date(date).toISOString().slice(0, 10).replace(/-/g, '')
}

function nextDay(date: string): string {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  // ICS lines must be max 75 octets; fold with CRLF + space
  const parts: string[] = []
  let remaining = line
  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75))
    remaining = ' ' + remaining.slice(75)
  }
  parts.push(remaining)
  return parts.join('\r\n')
}

export async function GET() {
  const baseUrl = getServerUrl()
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'events',
    sort: 'startDate',
    limit: 200,
    depth: 0,
  })

  const statusMap: Record<string, string> = {
    confirmed: 'CONFIRMED',
    tentative: 'TENTATIVE',
    cancelled: 'CANCELLED',
  }

  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const events = docs.flatMap((event) => {
    const useBackup = event.useBackupDate && event.backupStartDate
    const start = useBackup ? event.backupStartDate! : event.startDate
    const end = useBackup
      ? (event.backupEndDate || event.backupStartDate!)
      : (event.endDate || event.startDate)

    const lines = [
      'BEGIN:VEVENT',
      `UID:event-${event.id}@cvlt.ch`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatDate(start as string)}`,
      `DTEND;VALUE=DATE:${nextDay(end as string)}`,
      foldLine(`SUMMARY:${escapeIcs(event.title)}`),
      `STATUS:${statusMap[event.status as string] || 'CONFIRMED'}`,
      `URL:${baseUrl}/calendario/${event.slug}`,
    ]

    if (event.location) {
      lines.push(foldLine(`LOCATION:${escapeIcs(event.location as string)}`))
    }

    lines.push('END:VEVENT')

    if (event.backupStartDate && !useBackup) {
      const backupEnd = event.backupEndDate || event.backupStartDate
      lines.push(
        'BEGIN:VEVENT',
        `UID:event-${event.id}-riserva@cvlt.ch`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${formatDate(event.backupStartDate as string)}`,
        `DTEND;VALUE=DATE:${nextDay(backupEnd as string)}`,
        foldLine(`SUMMARY:${escapeIcs(event.title)} - riserva`),
        `STATUS:TENTATIVE`,
        `URL:${baseUrl}/calendario/${event.slug}`,
      )
      if (event.location) {
        lines.push(foldLine(`LOCATION:${escapeIcs(event.location as string)}`))
      }
      lines.push('END:VEVENT')
    }

    return lines.join('\r\n')
  })

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CVLT//Club Volo Libero Ticino//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CVLT Eventi',
    'X-WR-TIMEZONE:Europe/Zurich',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="cvlt-eventi.ics"',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
