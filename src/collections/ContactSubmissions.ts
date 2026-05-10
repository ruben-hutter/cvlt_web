import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Messaggio di contatto', plural: 'Messaggi di contatto' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'createdAt'],
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
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Messaggio',
      required: true,
    },
  ],
}
