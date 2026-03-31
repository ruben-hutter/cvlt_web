import Image from 'next/image'

export const metadata = {
  title: 'Comitato — CVLT',
}

const members = [
  {
    name: 'Mirko Bonacina',
    role: 'Presidente',
    license: 'Pilota',
    image: '/comitato/mirko-bonacina-i-150x150.jpg',
  },
  {
    name: 'Matteo Monzeglio',
    role: 'Vicepresidente',
    license: 'Pilota biposto',
    image: '/comitato/monze-150x150.jpg',
  },
  {
    name: 'Philipp Rothenbühler',
    role: 'Cassiere',
    license: 'Pilota',
    image: '/comitato/roti-i-150x150.jpg',
  },
  {
    name: 'Ruben Hutter',
    role: 'Segretario',
    license: 'Pilota',
    image: '/comitato/ruben-150x150.jpg',
  },
  {
    name: 'Christian Thio',
    role: 'Membro',
    license: 'Pilota biposto',
    image: '/comitato/thio-1-150x150.jpg',
  },
  {
    name: 'Elia Sartoris',
    role: 'Membro',
    license: 'Pilota',
    image: '/comitato/elia-150x150.jpg',
  },
  {
    name: 'Biagio Lepori',
    role: 'Supplente',
    license: 'Pilota biposto',
    image: '/comitato/biagio-1-150x150.jpg',
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
          <div
            key={member.name}
            className="flex w-full flex-col items-center rounded-lg border border-cvlt-gray-200 p-6 text-center transition-shadow hover:shadow-lg sm:w-56 lg:w-60"
          >
            <Image
              src={member.image}
              alt={member.name}
              width={150}
              height={150}
              className="rounded-full"
            />
            <h2 className="mt-4 text-lg font-bold text-cvlt-gray-900">
              {member.name}
            </h2>
            <p className="text-sm font-medium text-cvlt-blue">{member.role}</p>
            <p className="mt-1 text-xs text-cvlt-gray-500">{member.license}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
