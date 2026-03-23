import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const usersFile = path.join(__dirname, 'users.json')

type UserSeed = {
  name: string
  email: string
  password: string
  role: 'admin' | 'editor'
}

const users: UserSeed[] = JSON.parse(readFileSync(usersFile, 'utf-8'))

const payload = await getPayload({ config })

for (const user of users) {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: user.email } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log(`Skipping ${user.email} — already exists`)
    continue
  }

  await payload.create({
    collection: 'users',
    data: user,
  })
  console.log(`Created ${user.role}: ${user.email}`)
}

console.log('Done')
process.exit(0)
