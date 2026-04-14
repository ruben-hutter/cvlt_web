const requiredEnvVars = [
  'PAYLOAD_SECRET',
  'DATABASE_URI',
  'NEXT_PUBLIC_SERVER_URL',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'MEMBERSHIP_EMAIL',
  'SHOP_EMAIL',
  'CONTACT_EMAIL',
  'SHOP_PAYLINK_URL',
  'SHOP_ORDER_TOKEN_SECRET',
] as const

type RequiredEnvVar = (typeof requiredEnvVars)[number]

let validated = false

function getRaw(name: string): string | undefined {
  const value = process.env[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function mustGet(name: RequiredEnvVar): string {
  const value = getRaw(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function ensureUrl(name: 'NEXT_PUBLIC_SERVER_URL' | 'SHOP_PAYLINK_URL') {
  const value = mustGet(name)
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('must use http or https protocol')
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown reason'
    throw new Error(`Invalid ${name}: ${reason}`)
  }
}

export function validateEnvOrThrow() {
  if (validated) return

  const errors: string[] = []
  for (const name of requiredEnvVars) {
    if (!getRaw(name)) {
      errors.push(`Missing required environment variable: ${name}`)
    }
  }

  for (const name of ['NEXT_PUBLIC_SERVER_URL', 'SHOP_PAYLINK_URL'] as const) {
    if (!getRaw(name)) continue
    try {
      ensureUrl(name)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Invalid ${name}`)
    }
  }

  if (errors.length > 0) {
    console.error('[env] Invalid environment configuration:')
    for (const error of errors) {
      console.error(`[env] - ${error}`)
    }
    throw new Error('Environment validation failed.')
  }

  validated = true
}

export function requireEnv(name: RequiredEnvVar): string {
  validateEnvOrThrow()
  return mustGet(name)
}

export function getServerUrl(): string {
  return requireEnv('NEXT_PUBLIC_SERVER_URL')
}
