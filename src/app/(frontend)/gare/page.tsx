import type { Metadata } from 'next'
import { GareContent } from './GareContent'

export const metadata: Metadata = {
  title: 'Gare - CVLT',
}

export default function GarePage() {
  return <GareContent />
}
