import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const ShopOrders: CollectionConfig = {
  slug: 'shop-orders',
  labels: { singular: 'Ordine shop', plural: 'Ordini shop' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'orderRef',
    defaultColumns: ['orderRef', 'fullName', 'total', 'paymentMethod', 'paymentStatus', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  custom: {
    totp: { disableAccessWrapper: { create: true } },
  },
  fields: [
    {
      name: 'orderRef',
      type: 'text',
      label: 'Riferimento ordine',
      required: true,
      unique: true,
    },
    {
      name: 'fullName',
      type: 'text',
      label: 'Nome completo',
      admin: { readOnly: true },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.firstName && data?.lastName) {
              return `${data.lastName} ${data.firstName}`
            }
          },
        ],
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lastName',
          type: 'text',
          label: 'Cognome',
          required: true,
        },
        {
          name: 'firstName',
          type: 'text',
          label: 'Nome',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Telefono',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'address',
          type: 'text',
          label: 'Via e Nr.',
          required: true,
        },
        {
          name: 'postalCode',
          type: 'text',
          label: 'NPA',
          required: true,
        },
      ],
    },
    {
      name: 'city',
      type: 'text',
      label: 'Città',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Osservazioni',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'paymentMethod',
          type: 'select',
          label: 'Metodo di pagamento',
          required: true,
          options: [
            { label: 'TWINT', value: 'twint' },
            { label: 'Fattura', value: 'invoice' },
          ],
        },
        {
          name: 'paymentStatus',
          type: 'select',
          label: 'Stato pagamento',
          required: true,
          options: [
            { label: 'Pagato', value: 'paid' },
            { label: 'In attesa fattura', value: 'pending_invoice' },
          ],
        },
      ],
    },
    {
      name: 'total',
      type: 'number',
      label: 'Totale (CHF)',
      required: true,
      min: 0,
    },
    {
      name: 'items',
      type: 'json',
      label: 'Articoli',
      required: true,
    },
  ],
}
