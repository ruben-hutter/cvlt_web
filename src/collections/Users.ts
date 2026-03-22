import type { CollectionConfig } from 'payload'

export const isAdmin = ({ req: { user } }: { req: { user: any } }) => {
  return user?.role === 'admin'
}

export const isAdminOrSelf = ({ req: { user } }: { req: { user: any } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}

const isLoggedIn = ({ req: { user } }: { req: { user: any } }): boolean => {
  return !!user
}

function validatePassword(password: string): string | true {
  if (password.length < 8) return 'La password deve avere almeno 8 caratteri.'
  if (!/[A-Z]/.test(password)) return 'La password deve contenere almeno una lettera maiuscola.'
  if (!/[a-z]/.test(password)) return 'La password deve contenere almeno una lettera minuscola.'
  if (!/[0-9]/.test(password)) return 'La password deve contenere almeno un numero.'
  return true
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Utente',
    plural: 'Utenti',
  },
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => user?.role !== 'admin',
  },
  auth: {
    loginWithUsername: false,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (data?.password && (operation === 'create' || operation === 'update')) {
          const result = validatePassword(data.password)
          if (result !== true) throw new Error(result)
        }
        return data
      },
    ],
  },
  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: isLoggedIn,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Ruolo',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Redattore', value: 'editor' },
      ],
      access: {
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
