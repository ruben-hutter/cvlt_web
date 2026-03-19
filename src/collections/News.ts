import type { Access, Block, CollectionConfig, FieldHook } from 'payload'
import { isAdmin } from './Users'

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const formatSlug: FieldHook = async ({ data, req }) => {
  if (!data?.title) return undefined
  const baseSlug = titleToSlug(data.title)

  if (!req.payload) return baseSlug

  // Check for duplicates and append number if needed
  const existing = await req.payload.find({
    collection: 'news',
    where: { slug: { like: `${baseSlug}%` }, ...(data.id ? { id: { not_equals: data.id } } : {}) },
    limit: 100,
    depth: 0,
  })

  if (existing.docs.length === 0) return baseSlug

  const taken = new Set(existing.docs.map((d) => d.slug))
  if (!taken.has(baseSlug)) return baseSlug

  let i = 2
  while (taken.has(`${baseSlug}-${i}`)) i++
  return `${baseSlug}-${i}`
}

const isAdminOrAuthor: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { author: { equals: user.id } }
}

// --- Layout Blocks ---

const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Testo', plural: 'Testi' },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
}

const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: 'Immagine', plural: 'Immagini' },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Didascalia',
    },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'full',
      options: [
        { label: 'Piccola', value: 'small' },
        { label: 'Media', value: 'medium' },
        { label: 'Grande', value: 'large' },
        { label: 'Intera larghezza', value: 'full' },
      ],
    },
  ],
}

const TextImageBlock: Block = {
  slug: 'textImage',
  labels: { singular: 'Testo + Immagine', plural: 'Testo + Immagine' },
  fields: [
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'imageRight',
      options: [
        { label: 'Immagine a destra', value: 'imageRight' },
        { label: 'Immagine a sinistra', value: 'imageLeft' },
      ],
    },
    {
      name: 'text',
      type: 'richText',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Didascalia',
    },
  ],
}

const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'Galleria', plural: 'Gallerie' },
  fields: [
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 colonne', value: '2' },
        { label: '3 colonne', value: '3' },
        { label: '4 colonne', value: '4' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
  ],
}

const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Citazione', plural: 'Citazioni' },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      label: 'Autore',
    },
  ],
}

// --- Collection ---

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Notizia', plural: 'Notizie' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tags', 'publishDate', 'status'],
  },
  access: {
    read: () => true,
    delete: isAdminOrAuthor,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      hooks: {
        beforeValidate: [formatSlug],
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Generato automaticamente dal titolo.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Bozza', value: 'draft' },
        { label: 'Pubblicato', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Tag liberi (es. "sociale", "competizione", "formazione").',
      },
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      relationTo: 'events',
      label: 'Evento collegato',
      admin: {
        position: 'sidebar',
        description: 'Collega questa notizia a un evento del calendario.',
      },
    },
    {
      name: 'publishDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: 'Data di pubblicazione',
      hooks: {
        beforeValidate: [
          ({ value }) => {
            // If cleared, reset to today
            if (!value) return new Date().toISOString()
            return value
          },
        ],
      },
      validate: (value) => {
        if (!value) return true
        const selected = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        selected.setHours(0, 0, 0, 0)
        if (selected < today) return 'La data di pubblicazione non può essere nel passato.'
        return true
      },
      admin: {
        position: 'sidebar',
        description: 'La notizia sarà visibile a partire da questa data. Predefinito: oggi.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      blocks: [RichTextBlock, ImageBlock, TextImageBlock, GalleryBlock, QuoteBlock],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            // Auto-assign author on creation if not set
            if (!value && req.user) return req.user.id
            return value
          },
        ],
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Assegnato automaticamente.',
      },
    },
  ],
}
