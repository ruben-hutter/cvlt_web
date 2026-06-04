import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerUrl } from '@/lib/env'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

export const dynamic = 'force-dynamic'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function extractPlainText(layout: any[]): string {
  const parts: string[] = []
  for (const block of layout) {
    if (block.blockType === 'richText' && block.content) {
      parts.push(convertLexicalToPlaintext({ data: block.content }))
    }
    if (block.blockType === 'textImage' && block.text) {
      parts.push(convertLexicalToPlaintext({ data: block.text }))
    }
  }
  return parts.join('\n\n')
}

export async function GET() {
  const baseUrl = getServerUrl()
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
    const plainText = Array.isArray(doc.layout) ? extractPlainText(doc.layout) : ''
    const description = plainText.slice(0, 500)

    return `    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(description)}</description>
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
