import { RichText } from '@payloadcms/richtext-lexical/react'

type MediaValue = {
  url: string
  alt?: string
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

type QuoteBlock = {
  blockType: 'quote'
  text: string
  author?: string
}

type LayoutBlock = RichTextBlock | ImageBlock | TextImageBlock | GalleryBlock | QuoteBlock

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
  return (
    <figure className={className}>
      <img src={image.url} alt={image.alt || ''} className="h-auto w-full rounded" />
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
          <RichText data={block.content} />
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
          <RichText data={block.text} />
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

    case 'quote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-6 italic text-gray-700">
          <p className="text-lg">{block.text}</p>
          {block.author && (
            <footer className="mt-2 text-sm font-medium text-gray-500">&mdash; {block.author}</footer>
          )}
        </blockquote>
      )

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
