'use client'

import Image from 'next/image'
import { useState } from 'react'

interface FlipCardProps {
  name: string
  role: string
  license: string
  image: string
  description: string
}

export default function FlipCard({ name, role, license, image, description }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      className="group w-full sm:w-56 lg:w-60 [perspective:800px]"
    >
      <div
        className={`relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-cvlt-gray-200 bg-white p-6 text-center shadow-sm [backface-visibility:hidden]">
          <Image
            src={image}
            alt={name}
            width={120}
            height={120}
            className="rounded-full"
          />
          <h2 className="mt-3 text-lg font-bold text-cvlt-gray-900">{name}</h2>
          <p className="text-sm font-medium text-cvlt-blue">{role}</p>
          <p className="mt-1 text-xs text-cvlt-gray-500">{license}</p>
          <p className="mt-2 text-[10px] text-cvlt-gray-500">Clicca per scoprire</p>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-cvlt-blue bg-cvlt-blue-light p-6 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h2 className="text-lg font-bold text-cvlt-gray-900">{name}</h2>
          <p className="text-sm font-medium text-cvlt-blue">{role}</p>
          <p className="mt-3 text-sm text-cvlt-gray-700">{description}</p>
          <p className="mt-auto pt-3 text-[10px] text-cvlt-gray-500">Clicca per tornare</p>
        </div>
      </div>
    </div>
  )
}
