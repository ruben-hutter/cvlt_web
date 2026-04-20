import { appendFileSync, cpSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const standaloneDir = join(projectRoot, '.next', 'standalone')
const logDir = join(projectRoot, 'logs')
const logFile = join(logDir, 'server.log')

mkdirSync(logDir, { recursive: true })
mkdirSync(join(projectRoot, 'cache'), { recursive: true })

if (existsSync(standaloneDir)) {
  cpSync(join(projectRoot, 'public'), join(standaloneDir, 'public'), { recursive: true })
  cpSync(join(projectRoot, '.next', 'static'), join(standaloneDir, '.next', 'static'), { recursive: true })
}

const stamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

for (const method of ['log', 'error', 'warn']) {
  const original = console[method]
  console[method] = (...args) => {
    original(...args)
    appendFileSync(logFile, `${stamp()} ${args.join(' ')}\n`)
  }
}

await import('../.next/standalone/server.js')
