'use client'

import { useState, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import 'yet-another-react-lightbox/plugins/counter.css'
import 'yet-another-react-lightbox/styles.css'

export function ArticleLightbox({
  images,
  children,
}: {
  images: string[]
  children: React.ReactNode
}) {
  const [index, setIndex] = useState(-1)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        const originalSrc = target.getAttribute('data-original-src') || target.getAttribute('src')
        if (originalSrc) {
          const i = images.indexOf(originalSrc)
          if (i >= 0) {
            setIndex(i)
          }
        }
      }
    },
    [images],
  )

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={handleClick} className="[&_img]:cursor-pointer">
        {children}
      </div>
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={images.map((src) => ({ src }))}
        plugins={[Counter, Fullscreen]}
      />
    </>
  )
}
