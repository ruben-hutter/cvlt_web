import { RichText } from '@payloadcms/richtext-lexical/react'
import { richTextConverters } from '@/lib/richtext'

type MediaValue = {
  url: string
  alt?: string
  sizes?: {
    medium?: { url: string }
    thumbnail?: { url: string }
  }
}

type RichTextBlock = {
  blockType: 'richText'
  content: any
}

type ImageBlock = {
  blockType: 'image'
  image: MediaValue
  caption?: string
  size: 'small' | 'medium' | 'large' | 'full'
}

type TextImageBlock = {
  blockType: 'textImage'
  layout: 'imageRight' | 'imageLeft'
  text: any
  image: MediaValue
  caption?: string
}

type GalleryBlock = {
  blockType: 'gallery'
  columns: '2' | '3' | '4'
  images: Array<{ image: MediaValue; caption?: string }>
}

type AttachmentBlock = {
  blockType: 'attachment'
  file: MediaValue & { filename?: string }
  label?: string
}

type LayoutBlock = RichTextBlock | ImageBlock | TextImageBlock | GalleryBlock | AttachmentBlock

const imageSizeClasses = {
  small: 'max-w-xs mx-auto',
  medium: 'max-w-md mx-auto',
  large: 'max-w-2xl mx-auto',
  full: 'w-full',
}

const gridClasses = {
  '2': 'grid-cols-2',
  '3': 'grid-cols-2 sm:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-4',
}

function ImageFigure({ image, caption, className }: { image: MediaValue; caption?: string; className?: string }) {
  const src = image.sizes?.medium?.url || image.url
  return (
    <figure className={className}>
      <img src={src} data-original-src={image.url} alt={image.alt || ''} className="h-auto w-full rounded" loading="lazy" />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500">{caption}</figcaption>
      )}
    </figure>
  )
}

function RenderBlock({ block }: { block: LayoutBlock }) {
  switch (block.blockType) {
    case 'richText':
      return (
        <div className="prose prose-gray max-w-none">
          <RichText data={block.content} converters={richTextConverters} />
        </div>
      )

    case 'image':
      return (
        <ImageFigure
          image={block.image}
          caption={block.caption}
          className={imageSizeClasses[block.size]}
        />
      )

    case 'textImage': {
      const imageEl = (
        <ImageFigure image={block.image} caption={block.caption} className="flex-shrink-0" />
      )
      const textEl = (
        <div className="prose prose-gray max-w-none">
          <RichText data={block.text} converters={richTextConverters} />
        </div>
      )

      return (
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {block.layout === 'imageLeft' ? (
            <>
              <div className="md:w-2/5">{imageEl}</div>
              <div className="md:w-3/5">{textEl}</div>
            </>
          ) : (
            <>
              <div className="md:w-3/5">{textEl}</div>
              <div className="md:w-2/5">{imageEl}</div>
            </>
          )}
        </div>
      )
    }

    case 'gallery':
      return (
        <div className={`grid gap-4 ${gridClasses[block.columns]}`}>
          {block.images?.map((item, i) => (
            <ImageFigure key={i} image={item.image} caption={item.caption} />
          ))}
        </div>
      )

    case 'attachment': {
      const linkText = block.label || block.file.filename || 'Scarica file'
      return (
        <a
          href={block.file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25m-9-3h3.375m-3.375 0H9.375m3.375 0v3.375M15 12H9m6 3H9" />
          </svg>
          {linkText}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      )
    }

    default:
      return null
  }
}

export function NewsLayout({ blocks }: { blocks: LayoutBlock[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} />
      ))}
    </div>
  )
}
