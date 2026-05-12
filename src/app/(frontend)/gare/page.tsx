import type { Metadata } from 'next'
import { GareContent } from './GareContent'

export const metadata: Metadata = {
  title: 'Gare',
  description:
    'Calendario gare del Club Volo Libero Ticino: CCC Hall of Fame, Hike & Fly e Regio Sud.',
  alternates: { canonical: '/gare' },
}

export default function GarePage() {
  return <GareContent />
}
