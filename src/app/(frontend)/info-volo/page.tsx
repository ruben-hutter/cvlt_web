import type { Metadata } from 'next'
import { InfoVoloContent } from './InfoVoloContent'

export const metadata: Metadata = {
  title: 'Informazioni di volo',
  description:
    'Informazioni per il volo libero in Ticino: spazio aereo, TMA Locarno, webcams, meteo e link utili.',
  alternates: { canonical: '/info-volo' },
}

export default function InfoVoloPage() {
  return <InfoVoloContent />
}
