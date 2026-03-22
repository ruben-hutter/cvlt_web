'use client'

import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

type Photo = {
  url: string
  alt: string
  width: number
  height: number
}

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(-1)

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="group aspect-square overflow-hidden rounded-md bg-cvlt-gray-100"
          >
            <img
              src={photo.url}
              alt={photo.alt}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={photos.map((p) => ({
          src: p.url,
          alt: p.alt,
          width: p.width,
          height: p.height,
        }))}
      />
    </>
  )
}
