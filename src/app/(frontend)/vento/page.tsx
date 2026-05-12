import type { Metadata } from 'next'
import { VentoClient } from './VentoClient'

export const metadata: Metadata = {
  title: 'Vento & Meteo',
  description:
    'Dati meteo e vento in tempo reale per il volo libero nel Sud delle Alpi: stazioni, pressione e föhn.',
  alternates: { canonical: '/vento' },
}

export default function VentoPage() {
  return <VentoClient />
}
