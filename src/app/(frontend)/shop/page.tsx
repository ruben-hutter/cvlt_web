import { Suspense } from 'react'
import { ShopContent } from './ShopContent'

export const metadata = {
  title: 'Shop',
  description: 'Articoli del Club Volo Libero Ticino: abbigliamento e accessori per soci.',
  alternates: { canonical: '/shop' },
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  )
}
