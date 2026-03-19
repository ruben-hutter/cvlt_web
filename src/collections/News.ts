import type { Block, CollectionConfig, FieldHook } from 'payload'

const formatSlug: FieldHook = ({ data, value }) => {
  if (typeof value === 'string' && value.length > 0) return value
  if (data?.title) {
    return data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  return value
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
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', 'status'],
  },
  access: {
    read: () => true,
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
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [formatSlug],
      },
      admin: {
        position: 'sidebar',
        description: 'Generato automaticamente dal titolo. Modificabile.',
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
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'In evidenza', value: 'featured' },
        { label: 'Attività', value: 'activities' },
        { label: 'Archivio', value: 'archive' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
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
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
