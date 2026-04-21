export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function deduplicateSlug(
  payload: any,
  collection: string,
  baseSlug: string,
  excludeId?: number | string,
): Promise<string> {
  const existing = await payload.find({
    collection,
    where: {
      slug: { like: `${baseSlug}%` },
      ...(excludeId ? { id: { not_equals: excludeId } } : {}),
    },
    limit: 100,
    depth: 0,
  })

  if (existing.docs.length === 0) return baseSlug

  const taken = new Set(existing.docs.map((d: any) => d.slug))
  if (!taken.has(baseSlug)) return baseSlug

  let i = 2
  while (taken.has(`${baseSlug}-${i}`)) i++
  return `${baseSlug}-${i}`
}
