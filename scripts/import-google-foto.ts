import { getPayload } from 'payload'
import { promises as fs } from 'node:fs'
import path from 'node:path'

type CliOptions = {
  source: string
  dryRun: boolean
  limit?: number
  from?: string
  verbose: boolean
}

type FolderMeta = {
  title: string
  fixedDate?: Date
  fallbackYear?: number
}

const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.mp4', '.webm', '.mov'])
const GOOGLE_JSON_EXTENSION = '.json'
const FOTO_DA_YEAR_RE = /^foto\s+da\s+\d{4}$/i

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: '/home/ruben/CVLT/foto/Google Foto',
    dryRun: false,
    verbose: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }
    if (arg === '--verbose') {
      options.verbose = true
      continue
    }
    if (arg === '--source') {
      options.source = argv[i + 1] || options.source
      i += 1
      continue
    }
    if (arg === '--limit') {
      const parsed = Number(argv[i + 1])
      if (!Number.isNaN(parsed) && parsed > 0) options.limit = parsed
      i += 1
      continue
    }
    if (arg === '--from') {
      options.from = argv[i + 1] || undefined
      i += 1
      continue
    }
  }

  return options
}

function toPayloadDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}T12:00:00.000Z`
}

function parseFolderMeta(folderName: string): FolderMeta {
  const fullDate = folderName.match(/^(\d{4})-(\d{2})-(\d{2})\s*-\s*(.+)$/)
  if (fullDate) {
    const [, y, m, d, eventTitle] = fullDate
    return {
      title: eventTitle.trim(),
      fixedDate: new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))),
      fallbackYear: Number(y),
    }
  }

  const yearAndTitle = folderName.match(/^(\d{4})\s*-\s*(.+)$/)
  if (yearAndTitle) {
    const [, y, eventTitle] = yearAndTitle
    return {
      title: eventTitle.trim(),
      fallbackYear: Number(y),
    }
  }

  const fotoDaYear = folderName.match(/^foto\s+da\s+(\d{4})$/i)
  if (fotoDaYear) {
    const year = Number(fotoDaYear[1])
    return {
      title: folderName.trim(),
      fallbackYear: year,
    }
  }

  const looseYear = folderName.match(/^(\d{4})\s+(.+)$/)
  if (looseYear) {
    return {
      title: looseYear[2].trim(),
      fallbackYear: Number(looseYear[1]),
    }
  }

  return { title: folderName.trim() }
}

function parseJsonTimestamp(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null
  const unixSeconds = Number(raw)
  if (Number.isNaN(unixSeconds) || unixSeconds <= 0) return null
  return new Date(unixSeconds * 1000)
}

function parseDateFromFilename(filename: string): Date | null {
  const normalized = filename.replace(/_/g, ' ')

  const ymd = normalized.match(/(\d{4})[-.](\d{2})[-.](\d{2})/)
  if (ymd) {
    const [, y, m, d] = ymd
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  }

  const compact = normalized.match(/(?:^|\D)(20\d{2})(\d{2})(\d{2})(?:\D|$)/)
  if (compact) {
    const [, y, m, d] = compact
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  }

  return null
}

async function earliestDateFromFolder(folderPath: string): Promise<Date | null> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  const dates: Date[] = []

  const mediaFileNames = new Set(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase())),
  )

  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (path.extname(entry.name).toLowerCase() !== GOOGLE_JSON_EXTENSION) continue

    const fullPath = path.join(folderPath, entry.name)
    try {
      const raw = await fs.readFile(fullPath, 'utf8')
      const parsed = JSON.parse(raw) as {
        title?: string
        photoTakenTime?: { timestamp?: string }
        creationTime?: { timestamp?: string }
      }

      const title = parsed.title?.trim()
      if (title && !mediaFileNames.has(title)) {
        // Keep parsing timestamp anyway, because some Google exports truncate names.
      }

      const preferred =
        parseJsonTimestamp(parsed.photoTakenTime?.timestamp) ||
        parseJsonTimestamp(parsed.creationTime?.timestamp)
      if (preferred) dates.push(preferred)
    } catch {
      // Ignore malformed sidecar files.
    }
  }

  if (dates.length > 0) {
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  }

  for (const fileName of mediaFileNames) {
    const fromName = parseDateFromFilename(fileName)
    if (fromName) {
      dates.push(fromName)
      continue
    }

    const fullPath = path.join(folderPath, fileName)
    const stat = await fs.stat(fullPath)
    dates.push(stat.mtime)
  }

  if (dates.length === 0) return null
  return new Date(Math.min(...dates.map((d) => d.getTime())))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!process.env.PAYLOAD_SECRET) {
    process.env.PAYLOAD_SECRET = 'local-import-secret'
  }

  const sourceExists = await fs
    .access(options.source)
    .then(() => true)
    .catch(() => false)

  if (!sourceExists) {
    console.error(`[IMPORT] Source folder not found: ${options.source}`)
    process.exit(1)
  }

  const configModule = await import('../src/payload.config')
  const payload = await getPayload({ config: configModule.default })

  const allEntries = await fs.readdir(options.source, { withFileTypes: true })
  const folders = allEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => (options.from ? name.startsWith(options.from) : true))
    .sort((a, b) => a.localeCompare(b, 'it-CH'))

  const selectedFolders = typeof options.limit === 'number' ? folders.slice(0, options.limit) : folders
  console.log(
    `[IMPORT] Found ${folders.length} folders${options.from ? ` (from "${options.from}")` : ''}. Processing ${selectedFolders.length}.`,
  )
  console.log(`[IMPORT] Mode: ${options.dryRun ? 'DRY RUN' : 'WRITE'}`)

  let createdAlbums = 0
  let skippedAlbums = 0
  let uploadedMedia = 0

  for (const folderName of selectedFolders) {
    if (FOTO_DA_YEAR_RE.test(folderName)) {
      console.log(`[SKIP] "${folderName}" is a Google yearly rollup album.`)
      skippedAlbums += 1
      continue
    }

    const folderPath = path.join(options.source, folderName)
    const meta = parseFolderMeta(folderName)

    const entries = await fs.readdir(folderPath, { withFileTypes: true })
    const mediaFileNames = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'it-CH'))

    if (mediaFileNames.length === 0) {
      console.log(`[SKIP] "${folderName}" has no supported media files.`)
      skippedAlbums += 1
      continue
    }

    const inferredDate = meta.fixedDate || (await earliestDateFromFolder(folderPath))
    let albumDate = inferredDate
    if (!albumDate && meta.fallbackYear) {
      albumDate = new Date(Date.UTC(meta.fallbackYear, 0, 1))
    }
    if (!albumDate) {
      albumDate = new Date(Date.UTC(1970, 0, 1))
    }

    const payloadDate = toPayloadDate(albumDate)
    const albumTitle = meta.title

    const existing = await payload.find({
      collection: 'photo-albums',
      where: {
        and: [{ title: { equals: albumTitle } }, { date: { equals: payloadDate } }],
      },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      console.log(`[SKIP] Album exists: "${albumTitle}" (${payloadDate.slice(0, 10)})`)
      skippedAlbums += 1
      continue
    }

    if (options.dryRun) {
      console.log(`[DRY] Would create "${albumTitle}" (${payloadDate.slice(0, 10)}) with ${mediaFileNames.length} files.`)
      createdAlbums += 1
      uploadedMedia += mediaFileNames.length
      continue
    }

    const mediaIds: Array<number | string> = []
    for (const mediaName of mediaFileNames) {
      const mediaPath = path.join(folderPath, mediaName)
      const created = await payload.create({
        collection: 'media',
        data: { alt: path.parse(mediaName).name.replace(/[-_]/g, ' ') },
        filePath: mediaPath,
      })
      mediaIds.push(created.id)
      uploadedMedia += 1
      if (options.verbose) console.log(`  [FILE] ${mediaName} -> media#${created.id}`)
    }

    await payload.create({
      collection: 'photo-albums',
      data: {
        title: albumTitle,
        date: payloadDate,
        photos: mediaIds,
      },
    })

    createdAlbums += 1
    console.log(`[OK] Created "${albumTitle}" (${payloadDate.slice(0, 10)}) with ${mediaIds.length} files.`)
  }

  console.log(
    `[DONE] Albums created: ${createdAlbums}. Albums skipped: ${skippedAlbums}. Media uploaded: ${uploadedMedia}.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[IMPORT] Failed:', error)
    process.exit(1)
  })
