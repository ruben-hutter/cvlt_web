import Link from 'next/link'
import { FeaturedNewsBadge } from './FeaturedNewsBadge'

export type NewsCardProps = {
  id: string | number
  title: string
  slug: string | null | undefined
  publishDate: string
  thumbnailUrl: string | null
  tag: string | null
  relatedEvent: { title: string } | null
  variant?: 'grid' | 'row'
  showRelatedEvent?: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function RelatedEventPill({ title, className }: { title: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-cvlt-blue-light px-2 py-0.5 text-xs font-medium text-cvlt-blue ${className ?? ''}`}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
      {title}
    </span>
  )
}

export function NewsCard({
  id,
  title,
  slug,
  publishDate,
  thumbnailUrl,
  tag,
  relatedEvent,
  variant = 'grid',
  showRelatedEvent = true,
}: NewsCardProps) {
  const href = `/notizie/${slug ?? id}`

  if (variant === 'row') {
    return (
      <Link
        href={href}
        className="group flex gap-4 rounded-lg border border-cvlt-gray-200 p-4 transition-all hover:border-cvlt-blue/30 hover:shadow-md"
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            width={72}
            height={72}
            style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }}
            className="rounded-md"
          />
        )}
        <div className="min-w-0">
          <time className="text-xs font-medium text-cvlt-gray-500">{formatDate(publishDate)}</time>
          <h3 className="mt-1 text-base font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
            {title}
          </h3>
          {tag === 'featured' && <FeaturedNewsBadge />}
          {showRelatedEvent && relatedEvent && (
            <RelatedEventPill title={relatedEvent.title} className="mt-1.5" />
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-cvlt-gray-200 transition-all hover:border-cvlt-blue/30 hover:shadow-lg"
    >
      {thumbnailUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-cvlt-gray-100">
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <time className="text-xs font-medium text-cvlt-gray-500">{formatDate(publishDate)}</time>
        <h2 className="mt-1 text-base font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
          {title}
        </h2>
        {tag === 'featured' && <FeaturedNewsBadge />}
        {relatedEvent && <RelatedEventPill title={relatedEvent.title} className="mt-2" />}
      </div>
    </Link>
  )
}
