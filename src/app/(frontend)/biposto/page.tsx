import { BipostoContent } from './BipostoContent'

export const metadata = {
  title: 'Voli in Biposto',
  description:
    'Piloti tandem del Club Volo Libero Ticino per voli biposto in parapendio.',
  alternates: { canonical: '/biposto' },
}

export default function BipostoPage() {
  return <BipostoContent />
}
