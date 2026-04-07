'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'

type MediaItem = {
  url: string
  alt: string
  width: number
  height: number
  mimeType: string
}

function isVideo(mimeType: string) {
  return mimeType.startsWith('video/')
}

function PlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
        <svg className="h-6 w-6 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}

export function PhotoGrid({ photos }: { photos: MediaItem[] }) {
  const [index, setIndex] = useState(-1)
  const fullscreenRef = useRef<{ fullscreen: boolean; disabled: boolean; enter: () => void; exit: () => void }>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      fullscreenRef.current?.enter()
    }
  }, [])

  useEffect(() => {
    if (index < 0) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, handleKeyDown])

  const slides = photos.map((item) => {
    if (isVideo(item.mimeType)) {
      return {
        type: 'video' as const,
        width: item.width,
        height: item.height,
        sources: [{ src: item.url, type: item.mimeType }],
      }
    }
    return {
      type: 'image' as const,
      src: item.url,
      alt: item.alt,
      width: item.width,
      height: item.height,
    }
  })

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((item, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-md bg-cvlt-gray-100"
          >
            {isVideo(item.mimeType) ? (
              <>
                <video
                  src={item.url}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <PlayOverlay />
              </>
            ) : (
              <img
                src={item.url}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            )}
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Video, Fullscreen]}
        fullscreen={{ ref: fullscreenRef }}
        video={{ autoPlay: true, controls: true }}
      />
    </>
  )
}
