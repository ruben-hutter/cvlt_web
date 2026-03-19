export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { CalendarGrid } from './CalendarGrid'

export const metadata = {
  title: 'Calendario — CVLT',
}

export default async function CalendarPage() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'events',
    sort: 'startDate',
    limit: 200,
  })

  const events = result.docs.map((e) => ({
    id: String(e.id),
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate || null,
    backupDate: e.backupDate || null,
    location: e.location || null,
    status: e.status as 'confirmed' | 'tentative' | 'cancelled',
    externalLink: e.externalLink || null,
  }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Calendario</h1>
      <CalendarGrid events={events} />
    </main>
  )
}
