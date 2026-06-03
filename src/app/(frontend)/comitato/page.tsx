import FlipCard from './FlipCard'

export const metadata = {
  title: 'Comitato',
  description:
    'Il comitato direttivo del Club Volo Libero Ticino: presidente, vicepresidente, segretario, cassiere e membri.',
  alternates: { canonical: '/comitato' },
}

const members = [
  {
    name: 'Mirko Bonacina',
    role: 'Presidente',
    license: 'Pilota',
    image: '/comitato/mirko-bonacina-i-150x150.jpg',
    description: 'Presiede il club e coordina le attività del comitato direttivo.',
  },
  {
    name: 'Matteo Monzeglio',
    role: 'Vicepresidente',
    license: 'Pilota biposto',
    image: '/comitato/monze-150x150.jpg',
    description: 'Supporta il presidente e gestisce i voli biposto.',
  },
  {
    name: 'Philipp Rothenbühler',
    role: 'Cassiere',
    license: 'Pilota',
    image: '/comitato/roti-i-150x150.jpg',
    description: 'Administra le finanze e la contabilità del club.',
  },
  {
    name: 'Ruben Hutter',
    role: 'Segretario',
    license: 'Pilota',
    image: '/comitato/ruben-150x150.jpg',
    description: 'Gestisce la comunicazione e il sito web del club.',
  },
  {
    name: 'Christian Thio',
    role: 'Membro',
    license: 'Pilota biposto',
    image: '/comitato/thio-1-150x150.jpg',
    description: 'Pilota biposto e membro attivo del comitato.',
  },
  {
    name: 'Elia Sartoris',
    role: 'Membro',
    license: 'Pilota',
    image: '/comitato/elia-150x150.jpg',
    description: 'Membro attivo del comitato e pilota appassionato.',
  },
  {
    name: 'Biagio Lepori',
    role: 'Supplente',
    license: 'Pilota biposto',
    image: '/comitato/biagio-1-150x150.jpg',
    description: 'Sostituisce i membri del comitato in caso di assenza.',
  },
]

export default function ComitatoPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-cvlt-gray-900">Comitato</h1>
      <p className="mt-2 text-cvlt-gray-600">
        Il comitato direttivo del Club Volo Libero Ticino.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-8">
        {members.map((member) => (
          <FlipCard key={member.name} {...member} />
        ))}
      </div>
    </main>
  )
}
