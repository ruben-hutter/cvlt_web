'use client'

import { useState } from 'react'
import FlipCard from './FlipCard'

const members = [
  {
    name: 'Mirko Bonacina',
    role: 'Presidente',
    license: 'Pilota',
    image: '/comitato/mirko-bonacina-i-150x150.jpg',
    quote: 'Volo perché lassù il silenzio racconta più di mille parole.',
  },
  {
    name: 'Matteo Monzeglio',
    role: 'Vicepresidente',
    license: 'Pilota biposto',
    image: '/comitato/monze-150x150.jpg',
    quote: 'Volo per condividere lo stupore di chi guarda il mondo dall’alto per la prima volta.',
  },
  {
    name: 'Philipp Rothenbühler',
    role: 'Cassiere',
    license: 'Pilota',
    image: '/comitato/roti-i-150x150.jpg',
    quote: 'Volo perché ogni termica è una piccola promessa di libertà.',
  },
  {
    name: 'Ruben Hutter',
    role: 'Segretario',
    license: 'Pilota',
    image: '/comitato/ruben-150x150.jpg',
    quote: 'Volo per inseguire l’orizzonte e scoprire cosa c’è oltre.',
  },
  {
    name: 'Christian Thio',
    role: 'Membro',
    license: 'Pilota biposto',
    image: '/comitato/thio-1-150x150.jpg',
    quote: 'Volo perché il vento sa sempre dove portarmi.',
  },
  {
    name: 'Elia Sartoris',
    role: 'Membro',
    license: 'Pilota',
    image: '/comitato/elia-150x150.jpg',
    quote: 'Volo per quei pochi metri in cui la gravità si dimentica di me.',
  },
  {
    name: 'Biagio Lepori',
    role: 'Supplente',
    license: 'Pilota biposto',
    image: '/comitato/biagio-1-150x150.jpg',
    quote: 'Volo perché le montagne si guardano meglio con i piedi nel cielo.',
  },
]

export default function ComitatoPage() {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null)

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-cvlt-gray-900">Comitato</h1>
      <p className="mt-2 text-cvlt-gray-600">
        Il comitato direttivo del Club Volo Libero Ticino.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-8">
        {members.map((member, i) => (
          <FlipCard
            key={member.name}
            {...member}
            flipped={flippedIndex === i}
            onFlip={() => setFlippedIndex(flippedIndex === i ? null : i)}
          />
        ))}
      </div>
    </main>
  )
}
