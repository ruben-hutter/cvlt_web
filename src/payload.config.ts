import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'url'
import path from 'path'
import sharp from 'sharp'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  graphQL: { disable: true },
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./db/payload.db',
    },
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
})
