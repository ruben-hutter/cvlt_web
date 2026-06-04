import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerUrl } from '@/lib/env'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

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

function extractHtmlContent(layout: any[], baseUrl: string): string {
  const parts: string[] = []
  for (const block of layout) {
    if (block.blockType === 'richText' && block.content) {
      parts.push(convertLexicalToHTML({ data: block.content }))
    }
    if (block.blockType === 'textImage' && block.text) {
      const html = convertLexicalToHTML({ data: block.text })
      const imgUrl = block.image?.url ? String(block.image.url) : ''
      const caption = block.caption ? `<figcaption>${escapeXml(block.caption)}</figcaption>` : ''
      parts.push(imgUrl
        ? `<figure><img src="${escapeXml(imgUrl)}" alt="" style="max-width:100%" />${caption}</figure>${html}`
        : html)
    }
    if (block.blockType === 'image' && block.image?.url) {
      const caption = block.caption ? `<figcaption>${escapeXml(block.caption)}</figcaption>` : ''
      parts.push(`<figure><img src="${escapeXml(String(block.image.url))}" alt="" style="max-width:100%" />${caption}</figure>`)
    }
    if (block.blockType === 'gallery' && Array.isArray(block.images)) {
      const imgs = block.images
        .filter((item: any) => item.image?.url)
        .map((item: any) => `<img src="${escapeXml(String(item.image.url))}" alt="" style="max-width:100%" />`)
        .join('')
      parts.push(`<div>${imgs}</div>`)
    }
  }
  return parts.join('\n')
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
    const thumbUrl = typeof doc.thumbnail === 'object' && doc.thumbnail?.url
      ? String(doc.thumbnail.url)
      : null
    const thumbMimeType = typeof doc.thumbnail === 'object' && doc.thumbnail?.mimeType
      ? String(doc.thumbnail.mimeType)
      : 'image/jpeg'
    const thumbSize = typeof doc.thumbnail === 'object' && doc.thumbnail?.filesize
      ? Number(doc.thumbnail.filesize)
      : 0
    const plainText = Array.isArray(doc.layout) ? extractPlainText(doc.layout) : ''
    const htmlContent = Array.isArray(doc.layout) ? extractHtmlContent(doc.layout, baseUrl) : ''
    const description = plainText.slice(0, 500)

    return `    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${htmlContent}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>${thumbUrl ? `
      <enclosure url="${escapeXml(thumbUrl)}" length="${thumbSize}" type="${thumbMimeType}" />` : ''}
    </item>`
  })

  const lastBuild = docs.length > 0
    ? new Date(docs[0].publishDate as string).toUTCString()
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
