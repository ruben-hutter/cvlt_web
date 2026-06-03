import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comitato',
  description:
    'Il comitato direttivo del Club Volo Libero Ticino: presidente, vicepresidente, segretario, cassiere e membri.',
  alternates: { canonical: '/comitato' },
}

export default function ComitatoLayout({ children }: { children: React.ReactNode }) {
  return children
}
