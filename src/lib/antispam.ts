const MIN_FORM_TIME_MS = 1_500
const MAX_FORM_TIME_MS = 60 * 60 * 1_000

const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'test.net',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.net',
  '10minutemail.com',
  'yopmail.com',
  'tempmail.com',
  'tempmail.org',
  'temp-mail.org',
  'throwawaymail.com',
  'throwawaymail.net',
  'getnada.com',
  'maildrop.cc',
  'dispostable.com',
  'sharklasers.com',
  'fakeinbox.com',
  'trashmail.com',
  'trashmail.net',
  'mailnesia.com',
  'mintemail.com',
  'fakemail.net',
  'tempinbox.com',
  'grr.la',
  'spambog.com',
  'tempmailo.com',
  'mohmal.com',
  'emailondeck.com',
  'mailcatch.com',
])

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function isBlockedEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return false
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return true
  for (const blocked of BLOCKED_EMAIL_DOMAINS) {
    if (domain.endsWith('.' + blocked)) return true
  }
  return false
}

export type AntispamResult =
  | { ok: true }
  | { ok: false; reason: 'honeypot' | 'no-timestamp' | 'too-fast' | 'expired' | 'invalid-timestamp' }

export function validateAntispamFields(params: {
  honeypot?: unknown
  renderTs?: unknown
}): AntispamResult {
  const { honeypot, renderTs } = params

  if (
    honeypot !== undefined &&
    honeypot !== null &&
    (typeof honeypot !== 'string' || honeypot.trim() !== '')
  ) {
    return { ok: false, reason: 'honeypot' }
  }

  if (renderTs === undefined || renderTs === null) {
    return { ok: false, reason: 'no-timestamp' }
  }

  const ts = typeof renderTs === 'number' ? renderTs : Number(renderTs)
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: 'invalid-timestamp' }
  }

  const age = Date.now() - ts
  if (age < MIN_FORM_TIME_MS) {
    return { ok: false, reason: 'too-fast' }
  }
  if (age > MAX_FORM_TIME_MS) {
    return { ok: false, reason: 'expired' }
  }

  return { ok: true }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254
}

const FIELD_LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  address: 200,
  postalCode: 20,
  city: 100,
  message: 5000,
  notes: 2000,
} as const

export type FieldName = keyof typeof FIELD_LIMITS

export function isWithinLimit(value: string | undefined | null, field: FieldName): boolean {
  if (!value) return true
  return value.length <= FIELD_LIMITS[field]
}

export function isWithinArrayLimit(items: unknown[], max: number): boolean {
  return Array.isArray(items) && items.length <= max
}

export { FIELD_LIMITS }
