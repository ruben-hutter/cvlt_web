import type { Access, CollectionConfig } from 'payload'
import { isAdmin } from './Users'

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
      required: true,
    },
    {
      name: 'status',
      type: 'select',
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
      name: 'backupDate',
      type: 'date',
      label: 'Data di riserva',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
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
        position: 'sidebar',
        readOnly: true,
        description: 'Assegnato automaticamente.',
      },
    },
  ],
}
