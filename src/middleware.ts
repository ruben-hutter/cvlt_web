import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://assets.raisenow.io",
  "connect-src 'self' https://api3.geo.admin.ch",
  "frame-src https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': csp,
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const response = NextResponse.next()

  response.headers.append('x-pathname', pathname)

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

  return response
}
