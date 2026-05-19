import { LinkJSXConverter } from '@payloadcms/richtext-lexical/react'
import type { JSXConverters } from '@payloadcms/richtext-lexical/react'
import type { Payload } from 'payload'

export function richTextConverters({ defaultConverters }: { defaultConverters: JSXConverters }): JSXConverters {
  return {
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) => {
        const doc = linkNode.fields?.doc as { relationTo?: string; value?: unknown } | null | undefined
        const value = doc?.value
        const relationTo = doc?.relationTo

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const obj = value as Record<string, unknown>
          if (relationTo === 'media') {
            return (obj.url as string) || `/api/media/file/${obj.id}`
          }
          if (relationTo === 'news') {
            return obj.slug ? `/notizie/${obj.slug}` : '#'
          }
          if (relationTo === 'events') {
            return obj.slug ? `/calendario/${obj.slug}` : '#'
          }
          return `/${relationTo}/${obj.id}`
        }

        return '#'
      },
    }),
  }
}

export async function populateLexicalLinks(data: any, payload: Payload): Promise<any> {
  if (!data?.root?.children) return data

  const cloned = JSON.parse(JSON.stringify(data))

  async function walk(nodes: any[]) {
    for (const node of nodes) {
      if (
        node.type === 'link' &&
        node.fields?.linkType === 'internal' &&
        node.fields?.doc?.relationTo &&
        (typeof node.fields.doc.value === 'string' || typeof node.fields.doc.value === 'number')
      ) {
        try {
          node.fields.doc.value = await payload.findByID({
            collection: node.fields.doc.relationTo,
            id: node.fields.doc.value,
            depth: 0,
          })
        } catch {}
      }
      if (node.children) {
        await walk(node.children)
      }
    }
  }

  await walk(cloned.root.children)
  return cloned
}
