import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'news',
    where: { status: { equals: 'published' } },
    sort: '-publishDate',
    limit: 50,
    depth: 1,
  })

  const items = docs.map((doc) => {
    const link = `${baseUrl}/notizie/${doc.slug}`
    const pubDate = new Date(doc.publishDate as string).toUTCString()
    const thumbnail = typeof doc.thumbnail === 'object' && doc.thumbnail?.url
      ? `${baseUrl}${doc.thumbnail.url}`
      : null

    return `    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>${thumbnail ? `
      <enclosure url="${escapeXml(thumbnail)}" type="image/jpeg" />` : ''}
    </item>`
  })

  const lastBuild = docs.length > 0
    ? new Date(docs[0].publishDate as string).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CVLT &mdash; Club Volo Libero Ticino</title>
    <link>${baseUrl}</link>
    <description>Notizie del Club Volo Libero Ticino</description>
    <language>it</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${baseUrl}/feed" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
