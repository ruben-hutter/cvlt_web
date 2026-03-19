import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Immagine', plural: 'Immagini' },
  lockDocuments: false,
  upload: {
    mimeTypes: ['image/*'],
  },
  access: {
    read: () => true,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
