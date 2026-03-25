import type { CollectionConfig } from 'payload'

export const PhotoAlbums: CollectionConfig = {
  slug: 'photo-albums',
  labels: { singular: 'Galleria', plural: 'Galleria' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'photosCount'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Titolo',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      label: 'Data',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      label: 'Evento collegato',
      relationTo: 'events',
      admin: {
        description: 'Collegare opzionalmente a un evento del calendario.',
      },
    },
    {
      name: 'photos',
      type: 'upload',
      label: 'Foto / Video',
      relationTo: 'media',
      hasMany: true,
      required: true,
    },
  ],
}
