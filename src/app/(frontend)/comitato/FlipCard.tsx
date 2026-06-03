'use client'

import Image from 'next/image'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface FlipCardProps {
  name: string
  role: string
  license: string
  image: string
  quote: string
  flipped: boolean
  onFlip: () => void
}

export default function FlipCard({ name, role, license, image, quote, flipped, onFlip }: FlipCardProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState(0)

  useLayoutEffect(() => {
    if (!flipped) setTilt(0)
  }, [flipped])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (flipped || !innerRef.current) return
    const rect = innerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    setTilt(x * 15)
  }, [flipped])

  const handleMouseLeave = useCallback(() => {
    setTilt(0)
  }, [])

  return (
    <div
      onClick={onFlip}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group w-full sm:w-56 lg:w-60 cursor-pointer [perspective:800px]"
    >
      <div
        ref={innerRef}
        className="relative h-64 w-full transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateY(${flipped ? 180 : tilt}deg)` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-cvlt-gray-200 bg-white p-6 text-center shadow-sm transition-shadow group-hover:shadow-md [backface-visibility:hidden]">
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
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-cvlt-blue bg-cvlt-blue-light p-6 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h2 className="text-lg font-bold text-cvlt-gray-900">{name}</h2>
          <p className="text-sm font-medium text-cvlt-blue">{role}</p>
          <p className="mt-3 text-sm italic leading-relaxed text-cvlt-gray-700">“{quote}”</p>
        </div>
      </div>
    </div>
  )
}
