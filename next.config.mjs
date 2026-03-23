import { withPayload } from '@payloadcms/next/withPayload'

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL.includes('localhost'))
) {
  console.warn(
    '\n⚠️  WARNING: NEXT_PUBLIC_SERVER_URL is not set or points to localhost.\n' +
    '   Payload admin auth will break in production!\n' +
    '   Set it in .env before building (e.g. https://dev.cvlt.ch)\n',
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sharp'],
}

export default withPayload(nextConfig)
