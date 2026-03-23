import type { Metadata } from 'next'
import { InfoVoloContent } from './InfoVoloContent'

export const metadata: Metadata = {
  title: 'Informazioni di volo — CVLT',
}

export default function InfoVoloPage() {
  return <InfoVoloContent />
}
