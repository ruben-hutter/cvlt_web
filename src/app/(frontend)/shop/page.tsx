import { Suspense } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ShopContent } from './ShopContent'
import { getAvailabilityMap } from '@/lib/shop-stock'

export const metadata = {
  title: 'Shop',
  description: 'Articoli del Club Volo Libero Ticino: abbigliamento e accessori per soci.',
  alternates: { canonical: '/shop' },
}

export const revalidate = 0

export default async function ShopPage() {
  const payload = await getPayload({ config })
  const availability = await getAvailabilityMap(payload)

  return (
    <Suspense>
      <ShopContent availability={availability} />
    </Suspense>
  )
}
