import type { CollectionConfig } from 'payload'
import { isAdmin, isLoggedIn } from './Users'

function sanitizeFilename(name: string): string {
  const ext = name.match(/\.[^.]+$/)?.[0] || ''
  const base = name.replace(/\.[^.]+$/, '')
  const sanitized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return sanitized + ext.toLowerCase()
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/x-m4v', 'video/webm', 'video/quicktime', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, formatOptions: { format: 'webp' } },
      { name: 'medium', width: 1024, formatOptions: { format: 'webp' } },
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
    beforeOperation: [
      ({ req, operation }) => {
        if ((operation === 'create' || operation === 'update') && req.file?.name) {
          req.file.name = sanitizeFilename(req.file.name)
        }
      },
    ],
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
