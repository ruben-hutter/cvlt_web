import { appendFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const logDir = join(projectRoot, 'logs')
const logFile = join(logDir, 'server.log')

mkdirSync(logDir, { recursive: true })

const stamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

for (const method of ['log', 'error', 'warn']) {
  const original = console[method]
  console[method] = (...args) => {
    original(...args)
    appendFileSync(logFile, `${stamp()} ${args.join(' ')}\n`)
  }
}

await import('../.next/standalone/server.js')
