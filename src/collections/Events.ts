import type { Access, CollectionConfig, FieldHook } from 'payload'
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

  const existing = await req.payload.find({
    collection: 'events',
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

const isAdminOrCreator: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { createdBy: { equals: user.id } }
}

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Evento', plural: 'Eventi' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'location', 'status'],
  },
  access: {
    read: () => true,
    delete: isAdminOrCreator,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Titolo',
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
        hidden: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Stato',
      defaultValue: 'confirmed',
      options: [
        { label: 'Confermato', value: 'confirmed' },
        { label: 'Provvisorio', value: 'tentative' },
        { label: 'Annullato', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      label: 'Data inizio',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Data fine',
      admin: {
        description: 'Lasciare vuoto per eventi di un solo giorno.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'backupStartDate',
      type: 'date',
      label: 'Data di riserva (inizio)',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'backupEndDate',
      type: 'date',
      label: 'Data di riserva (fine)',
      admin: {
        description: 'Lasciare vuoto se la data di riserva è di un solo giorno.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'useBackupDate',
      type: 'checkbox',
      label: 'Spostato alla data di riserva',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Attivare se l\'evento si svolge alla data di riserva.',
        condition: (data) => Boolean(data?.backupStartDate),
      },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Luogo / Punto di ritrovo',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descrizione',
    },
    {
      name: 'externalLink',
      type: 'text',
      label: 'Link esterno',
      admin: {
        description: 'URL a pagina esterna (es. iscrizione, dettagli).',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      label: 'Creato da',
      relationTo: 'users',
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            if (!value && req.user) return req.user.id
            return value
          },
        ],
      },
      admin: {
        hidden: true,
      },
    },
  ],
}
