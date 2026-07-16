import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export type ReservationStatus = 'active' | 'fulfilled' | 'released'

export type ReservationItem = {
  key: string
  qty: number
}

export const ShopReservations: CollectionConfig = {
  slug: 'shop-reservations',
  labels: { singular: 'Prenotazione shop', plural: 'Prenotazioni shop' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'orderRef',
    group: 'Shop',
    defaultColumns: ['orderRef', 'status', 'expiresAt', 'createdAt'],
    description:
      'Prenotazioni di magazzino per checkout TWINT non ancora confermati. Gestite automaticamente dal sistema: scadono dopo 2 ore e rilasciano la quantità. Sola lettura.',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'orderRef',
      type: 'text',
      label: 'Riferimento ordine',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Stato',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Attiva', value: 'active' },
        { label: 'Confermata', value: 'fulfilled' },
        { label: 'Rilasciata', value: 'released' },
      ],
    },
    {
      name: 'items',
      type: 'json',
      label: 'Articoli (chiave + quantità)',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Scadenza',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
