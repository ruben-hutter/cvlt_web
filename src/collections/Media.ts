import type { CollectionConfig } from 'payload'
import { isAdmin, isLoggedIn } from './Users'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/x-m4v', 'video/webm', 'video/quicktime'],
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'medium', width: 1024 },
    ],
    adminThumbnail: 'thumbnail',
  },
  access: {
    read: () => true,
    create: isLoggedIn,
    update: isAdmin,
    delete: isAdmin,
  },
  custom: {
    totp: { disableAccessWrapper: { read: true } },
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (data && !data.alt) {
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
