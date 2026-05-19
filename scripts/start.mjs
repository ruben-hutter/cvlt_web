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

const mb = (bytes) => `${Math.round(bytes / 1024 / 1024)}MB`
const logMemory = () => {
  const m = process.memoryUsage()
  console.log(`memory: rss=${mb(m.rss)} heap=${mb(m.heapUsed)}/${mb(m.heapTotal)} ext=${mb(m.external)}`)
}

console.log(`Node.js ${process.version} — pid ${process.pid}`)
logMemory()
setInterval(logMemory, 300000)

console.log('[MIGRATE] Running pending migrations...')
try {
  const { execSync } = await import('child_process')
  execSync('npx payload migrate', { stdio: 'inherit', env: { ...process.env } })
  console.log('[MIGRATE] Done.')
} catch (e) {
  console.error('[MIGRATE] Migration failed:', e)
  process.exit(1)
}

await import('../.next/standalone/server.js')

setTimeout(async () => {
  try {
    const port = process.env.PORT || 3000
    const res = await fetch(`http://localhost:${port}/api/vento/foehn`)
    console.log(`[CACHE] Foehn cache warmed (status ${res.status})`)
  } catch (e) {
    console.error('[CACHE] Failed to warm foehn cache:', e)
  }
}, 5000)
