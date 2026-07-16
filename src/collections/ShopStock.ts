import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const ShopStock: CollectionConfig = {
  slug: 'shop-stock',
  labels: { singular: 'Stock', plural: 'Stock' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'productName',
    group: 'Shop',
    defaultColumns: ['productName', 'variant', 'size', 'stock'],
    description:
      'Quantità in magazzino per ogni articolo (prodotto + variante + taglia). Le righe vengono generate automaticamente dal catalogo in codice (src/lib/shop-catalog.ts) tramite lo script di seed. Modifica qui solo il campo "Quantità".',
  },
  access: {
    read: () => true,
    create: () => false,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      label: 'Chiave (prodotto__variante__taglia)',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'Generata automaticamente, non modificare.' },
    },
    {
      name: 'productName',
      type: 'text',
      label: 'Prodotto',
      required: true,
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'variant',
          type: 'text',
          label: 'Variante',
          required: true,
          admin: { readOnly: true },
        },
        {
          name: 'size',
          type: 'text',
          label: 'Taglia',
          required: true,
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'stock',
      type: 'number',
      label: 'Quantità',
      required: true,
      min: 0,
      defaultValue: 0,
      admin: {
        description:
          'Unità fisiche in magazzino. Le prenotazioni in corso (checkout TWINT non completati) riducono la disponibilità mostrata sul sito.',
      },
    },
  ],
}
