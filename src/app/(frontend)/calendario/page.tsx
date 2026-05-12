export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { CalendarGrid } from './CalendarGrid'
import { SubscribeButton } from './SubscribeButton'
import { uiSecondaryButtonClass } from '@/lib/ui'

export const metadata = {
  title: 'Calendario',
  description:
    'Calendario eventi del Club Volo Libero Ticino: gare, raduni, corsi e attività per parapendisti e deltisti in Ticino.',
  alternates: { canonical: '/calendario' },
}

export default async function CalendarPage() {
  let events: Array<{
    id: string
    slug: string
    title: string
    startDate: string
    endDate: string | null
    backupStartDate: string | null
    backupEndDate: string | null
    location: string | null
    status: 'confirmed' | 'tentative' | 'cancelled'
    externalLink: string | null
    useBackupDate: boolean
    relatedNews: Array<{ title: string; slug: string }>
  }> = []

  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'events',
      sort: 'startDate',
      limit: 200,
    })

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    const newsResult = await payload.find({
      collection: 'news',
      where: {
        status: { equals: 'published' },
        publishDate: { less_than_equal: endOfToday.toISOString() },
        relatedEvent: { exists: true },
      },
      limit: 200,
      depth: 0,
    })

    const newsByEvent = new Map<number, Array<{ title: string; slug: string }>>()
    for (const article of newsResult.docs) {
      const eventId = typeof article.relatedEvent === 'object'
        ? (article.relatedEvent as any)?.id
        : article.relatedEvent
      if (eventId != null) {
        if (!newsByEvent.has(eventId)) newsByEvent.set(eventId, [])
        newsByEvent.get(eventId)!.push({ title: article.title, slug: article.slug || '' })
      }
    }

    events = result.docs.map((e) => ({
      id: String(e.id),
      slug: (e.slug as string) || String(e.id),
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate || null,
      backupStartDate: e.backupStartDate || null,
      backupEndDate: e.backupEndDate || null,
      location: e.location || null,
      status: e.status as 'confirmed' | 'tentative' | 'cancelled',
      externalLink: e.externalLink || null,
      useBackupDate: Boolean(e.useBackupDate),
      relatedNews: newsByEvent.get(e.id as number) || [],
    }))
  } catch (e) {
    console.error('[CALENDARIO] DB query failed:', e)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cvlt-gray-900">Calendario</h1>
        <div className="flex gap-2">
          <SubscribeButton />
          <a
            href="/calendario.ics"
            title="Scarica calendario"
            className={`${uiSecondaryButtonClass} gap-1.5 border-cvlt-gray-200 px-3 py-1.5 text-xs text-cvlt-gray-500 hover:border-cvlt-blue/30`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            iCal
          </a>
        </div>
      </div>
      <CalendarGrid events={events} />
    </main>
  )
}
