import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp'],
}

export default withPayload(nextConfig)
