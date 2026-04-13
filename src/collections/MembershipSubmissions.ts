import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const MembershipSubmissions: CollectionConfig = {
  slug: 'membership-submissions',
  labels: { singular: 'Richiesta di adesione', plural: 'Richieste di adesione' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'membershipType', 'createdAt'],
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
      name: 'address',
      type: 'text',
      label: 'Via e Nr.',
      required: true,
    },
    {
      name: 'city',
      type: 'text',
      label: 'NPA e Domicilio',
      required: true,
    },
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
    {
      name: 'membershipType',
      type: 'select',
      label: 'Tipo di iscrizione',
      required: true,
      options: [
        { label: 'Socio attivo - CHF 40.–', value: 'active' },
        { label: 'Famiglia - CHF 45.–', value: 'family' },
        { label: 'Sostenitore - contributo libero', value: 'supporter' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Osservazioni',
    },
  ],
}
