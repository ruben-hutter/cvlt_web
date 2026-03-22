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
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (data && !data.alt) {
          // Use the uploaded filename (without extension) as alt text
          const filename = data.filename || req?.file?.name || ''
          if (filename) {
            data.alt = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Testo alternativo',
      admin: {
        description: 'Se lasciato vuoto, verrà usato il nome del file.',
      },
    },
  ],
}
