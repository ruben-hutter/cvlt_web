import type { CollectionConfig, FieldHook } from 'payload'
import { titleToSlug, deduplicateSlug } from '../lib/slug'

const formatSlug: FieldHook = async ({ data, originalDoc, operation, req }) => {
  if (!data?.title) return undefined

  if (
    operation === 'update' &&
    originalDoc?.slug &&
    originalDoc?.title === data.title &&
    originalDoc?.date === data.date
  ) {
    return originalDoc.slug
  }

  const baseSlug = data.date
    ? `${titleToSlug(data.title)}-${new Date(data.date).getFullYear()}`
    : titleToSlug(data.title)

  if (!req.payload) return baseSlug
  return deduplicateSlug(req.payload, 'photo-albums', baseSlug, data.id)
}

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
  custom: {
    totp: { disableAccessWrapper: { read: true } },
  },
  hooks: {
    afterDelete: [
      async ({ doc, req }) => {
        const photos = Array.isArray(doc?.photos) ? doc.photos : []
        const mediaIds = photos
          .map((photo: unknown) => {
            if (typeof photo === 'object' && photo !== null && 'id' in photo) {
              return (photo as { id?: unknown }).id
            }
            return photo
          })
          .filter((id: unknown): id is number | string => typeof id === 'number' || typeof id === 'string')

        for (const mediaID of mediaIds) {
          // Delete linked media only if no other album still references it.
          const stillReferenced = await req.payload.find({
            collection: 'photo-albums',
            where: { photos: { contains: mediaID } },
            limit: 1,
            depth: 0,
          })

          if (stillReferenced.totalDocs > 0) continue

          try {
            await req.payload.delete({
              collection: 'media',
              id: mediaID,
            })
          } catch (error) {
            req.payload.logger.warn(
              `[photo-albums] could not cascade-delete media ${String(mediaID)}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            )
          }
        }
      },
    ],
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
