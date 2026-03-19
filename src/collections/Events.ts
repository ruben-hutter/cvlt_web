import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'location', 'status'],
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
  ],
}
