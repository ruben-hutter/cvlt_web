'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

export function RefreshOnSave() {
  const router = useRouter()
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL

  if (!serverURL) {
    throw new Error('Missing NEXT_PUBLIC_SERVER_URL')
  }

  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={serverURL}
    />
  )
}
