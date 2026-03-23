export const revalidate = 60

import { getPayload } from 'payload'
import config from '@payload-config'
import { CalendarGrid } from './CalendarGrid'

export const metadata = {
  title: 'Calendario — CVLT',
}

export default async function CalendarPage() {
  let events: Array<{
    id: string
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
    console.warn('[CALENDARIO] DB query failed (build-time prerender?)', e)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-cvlt-gray-900">Calendario</h1>
      <CalendarGrid events={events} />
    </main>
  )
}
